-- Cash & Banks: immutable reversal engine with a complete audit trail.
-- REVIEW ONLY: do not apply to Supabase until this migration is approved.

begin;

alter table public.cash_bank_transactions
  add column if not exists reversal_of_transaction_id uuid
    references public.cash_bank_transactions(id) on delete restrict;

create unique index if not exists cash_bank_transactions_one_reversal_uidx
  on public.cash_bank_transactions (reversal_of_transaction_id)
  where reversal_of_transaction_id is not null;

alter table public.cash_bank_transactions
  drop constraint if exists cash_bank_transactions_not_self_reversal;
alter table public.cash_bank_transactions
  add constraint cash_bank_transactions_not_self_reversal
  check (reversal_of_transaction_id is null or reversal_of_transaction_id <> id);

create or replace function public.reverse_cash_bank_transaction(
  p_client_request_id uuid,
  p_transaction_id uuid,
  p_reversal_date date,
  p_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  original public.cash_bank_transactions%rowtype;
  generated_transaction_id uuid;
  generated_journal_id uuid;
  reversal_type text;
  reversal_source_id uuid;
  reversal_destination_id uuid;
  available_balance numeric(18, 2);
  reversal_description text;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to reverse cash or bank transactions'
      using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_transaction_id is null
    or p_reversal_date is null
    or btrim(coalesce(p_reason, '')) = '' then
    raise exception 'Request, transaction, date, and reason are required'
      using errcode = '22023';
  end if;

  select movement.id
  into generated_transaction_id
  from public.cash_bank_transactions movement
  where movement.client_request_id = p_client_request_id
    and movement.created_by = (select auth.uid())
    and movement.reversal_of_transaction_id = p_transaction_id;

  if generated_transaction_id is not null then
    return generated_transaction_id;
  end if;

  select movement.*
  into original
  from public.cash_bank_transactions movement
  where movement.id = p_transaction_id
  for update;

  if original.id is null then
    raise exception 'Original cash or bank transaction was not found'
      using errcode = '23503';
  end if;

  if original.status <> 'posted' or original.journal_id is null then
    raise exception 'Only posted transactions can be reversed'
      using errcode = '23514';
  end if;

  if original.reversal_of_transaction_id is not null then
    raise exception 'A reversal transaction cannot be reversed'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.cash_bank_transactions movement
    where movement.reversal_of_transaction_id = original.id
  ) then
    raise exception 'Transaction has already been reversed'
      using errcode = '23505';
  end if;

  if original.transaction_type = 'deposit' then
    reversal_type := 'withdrawal';
    reversal_source_id := original.destination_account_id;
    reversal_destination_id := null;
  elsif original.transaction_type = 'withdrawal' then
    reversal_type := 'deposit';
    reversal_source_id := null;
    reversal_destination_id := original.source_account_id;
  else
    reversal_type := 'transfer';
    reversal_source_id := original.destination_account_id;
    reversal_destination_id := original.source_account_id;
  end if;

  perform account.id
  from public.cash_bank_accounts account
  where account.id in (reversal_source_id, reversal_destination_id)
  order by account.id
  for update;

  if reversal_source_id is not null then
    select account.opening_balance
      + coalesce(sum(
          case
            when movement.status = 'posted' and movement.destination_account_id = account.id
              then movement.amount
            when movement.status = 'posted' and movement.source_account_id = account.id
              then -movement.amount
            else 0
          end
        ), 0)
    into available_balance
    from public.cash_bank_accounts account
    left join public.cash_bank_transactions movement
      on movement.source_account_id = account.id
      or movement.destination_account_id = account.id
    where account.id = reversal_source_id
      and account.is_active
      and account.currency_code = 'EGP'
    group by account.id;

    if available_balance is null or available_balance < original.amount then
      raise exception 'Insufficient balance to reverse the original transaction'
        using errcode = '23514';
    end if;
  end if;

  reversal_description := concat('Reversal: ', btrim(p_reason));

  insert into public.cash_bank_transactions (
    transaction_date,
    transaction_type,
    source_account_id,
    destination_account_id,
    amount,
    description,
    reference_number,
    status,
    created_by,
    client_request_id,
    reversal_of_transaction_id
  )
  values (
    p_reversal_date,
    reversal_type,
    reversal_source_id,
    reversal_destination_id,
    original.amount,
    reversal_description,
    original.reference_number,
    'draft',
    (select auth.uid()),
    p_client_request_id,
    original.id
  )
  returning id into generated_transaction_id;

  insert into public.journals (
    journal_date,
    description,
    status,
    source_type,
    source_id,
    created_by
  )
  values (
    p_reversal_date,
    reversal_description,
    'draft',
    'cash_bank_reversal',
    generated_transaction_id,
    (select auth.uid())
  )
  returning id into generated_journal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    description,
    debit,
    credit,
    created_by
  )
  select
    generated_journal_id,
    original_line.line_number,
    original_line.account_id,
    reversal_description,
    original_line.credit,
    original_line.debit,
    (select auth.uid())
  from public.journal_lines original_line
  where original_line.journal_id = original.journal_id
  order by original_line.line_number;

  if not found then
    raise exception 'Original journal lines were not found'
      using errcode = '23503';
  end if;

  update public.journals
  set status = 'posted'
  where id = generated_journal_id;

  update public.cash_bank_transactions
  set
    status = 'posted',
    journal_id = generated_journal_id,
    posted_at = now()
  where id = generated_transaction_id;

  return generated_transaction_id;
end;
$$;

revoke all on function public.reverse_cash_bank_transaction(uuid, uuid, date, text)
  from public;
grant execute on function public.reverse_cash_bank_transaction(uuid, uuid, date, text)
  to authenticated;

comment on column public.cash_bank_transactions.reversal_of_transaction_id is
  'Immutable link from a posted reversal movement to its original posted movement.';
comment on function public.reverse_cash_bank_transaction(uuid, uuid, date, text) is
  'Creates and posts one immutable reversing movement and inverse journal without mutating the original transaction.';

commit;

-- Manual rollback is allowed only before any reversal records exist:
-- drop function if exists public.reverse_cash_bank_transaction(uuid, uuid, date, text);
-- drop index if exists public.cash_bank_transactions_one_reversal_uidx;
-- alter table public.cash_bank_transactions drop column if exists reversal_of_transaction_id;

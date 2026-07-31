-- Cash & Banks: atomic transfer posting engine.
-- REVIEW ONLY: do not apply to Supabase until this migration is approved.

begin;

create or replace function public.post_cash_bank_transfer(
  p_client_request_id uuid,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_description text,
  p_reference_number text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  generated_transaction_id uuid;
  generated_journal_id uuid;
  source_ledger_account_id uuid;
  destination_ledger_account_id uuid;
  normalized_amount numeric(18, 2);
  available_balance numeric(18, 2);
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to post cash or bank transfers'
      using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_source_account_id is null
    or p_destination_account_id is null
    or p_transaction_date is null
    or btrim(coalesce(p_description, '')) = '' then
    raise exception 'Request, accounts, date, and description are required'
      using errcode = '22023';
  end if;

  if p_source_account_id = p_destination_account_id then
    raise exception 'Source and destination accounts must be different'
      using errcode = '23514';
  end if;

  normalized_amount := round(p_amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero'
      using errcode = '22023';
  end if;

  -- A deterministic lock order prevents deadlocks for opposite transfers and
  -- serializes balance-sensitive operations with withdrawals.
  perform account.id
  from public.cash_bank_accounts account
  where account.id in (p_source_account_id, p_destination_account_id)
  order by account.id
  for update;

  select account.ledger_account_id
  into source_ledger_account_id
  from public.cash_bank_accounts account
  join public.accounts ledger on ledger.id = account.ledger_account_id
  where account.id = p_source_account_id
    and account.is_active
    and account.currency_code = 'EGP'
    and ledger.is_active
    and ledger.is_postable
    and ledger.account_type = 'asset';

  select account.ledger_account_id
  into destination_ledger_account_id
  from public.cash_bank_accounts account
  join public.accounts ledger on ledger.id = account.ledger_account_id
  where account.id = p_destination_account_id
    and account.is_active
    and account.currency_code = 'EGP'
    and ledger.is_active
    and ledger.is_postable
    and ledger.account_type = 'asset';

  if source_ledger_account_id is null or destination_ledger_account_id is null then
    raise exception 'Source or destination cash/bank account is unavailable'
      using errcode = '23503';
  end if;

  if source_ledger_account_id = destination_ledger_account_id then
    raise exception 'Source and destination ledger accounts must be different'
      using errcode = '23514';
  end if;

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
  where account.id = p_source_account_id
  group by account.id;

  if available_balance < normalized_amount then
    raise exception 'Insufficient source cash or bank account balance'
      using errcode = '23514';
  end if;

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
    client_request_id
  )
  values (
    p_transaction_date,
    'transfer',
    p_source_account_id,
    p_destination_account_id,
    normalized_amount,
    btrim(p_description),
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    'draft',
    (select auth.uid()),
    p_client_request_id
  )
  on conflict (client_request_id) where client_request_id is not null do nothing
  returning id into generated_transaction_id;

  if generated_transaction_id is null then
    select movement.id
    into generated_transaction_id
    from public.cash_bank_transactions movement
    where movement.client_request_id = p_client_request_id
      and movement.created_by = (select auth.uid())
      and movement.transaction_type = 'transfer';

    if generated_transaction_id is null then
      raise exception 'Request identifier is already in use'
        using errcode = '23505';
    end if;

    return generated_transaction_id;
  end if;

  insert into public.journals (
    journal_date,
    description,
    status,
    source_type,
    source_id,
    created_by
  )
  values (
    p_transaction_date,
    btrim(p_description),
    'draft',
    'cash_bank_transfer',
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
  values
    (
      generated_journal_id,
      1,
      destination_ledger_account_id,
      btrim(p_description),
      normalized_amount,
      0,
      (select auth.uid())
    ),
    (
      generated_journal_id,
      2,
      source_ledger_account_id,
      btrim(p_description),
      0,
      normalized_amount,
      (select auth.uid())
    );

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

revoke all on function public.post_cash_bank_transfer(uuid, uuid, uuid, date, numeric, text, text)
  from public;
grant execute on function public.post_cash_bank_transfer(uuid, uuid, uuid, date, numeric, text, text)
  to authenticated;

comment on function public.post_cash_bank_transfer(uuid, uuid, uuid, date, numeric, text, text) is
  'Atomically transfers EGP between two operational cash/bank accounts with balance, concurrency, and idempotency protection.';

commit;

-- Manual rollback reference (only before production transfers exist):
-- drop function if exists public.post_cash_bank_transfer(uuid, uuid, uuid, date, numeric, text, text);

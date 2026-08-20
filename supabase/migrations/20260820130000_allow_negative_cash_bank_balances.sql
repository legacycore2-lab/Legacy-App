-- Unify cash/bank posting behavior with journal posting.
-- Withdrawals and transfers may take a cash/bank account below zero.
-- The ledger remains the source of truth; negative balances are allowed and surfaced by the UI.

create or replace function public.post_cash_bank_withdrawal(
  p_client_request_id uuid,
  p_source_account_id uuid,
  p_offset_account_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_description text,
  p_reference_number text default null::text
)
returns uuid
language plpgsql
set search_path to 'public'
as $function$
declare
  generated_transaction_id uuid;
  generated_journal_id uuid;
  source_ledger_account_id uuid;
  normalized_amount numeric(18, 2);
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to post cash or bank withdrawals' using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_source_account_id is null
    or p_offset_account_id is null
    or p_transaction_date is null
    or btrim(coalesce(p_description, '')) = '' then
    raise exception 'Request, accounts, date, and description are required' using errcode = '22023';
  end if;

  normalized_amount := round(p_amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero' using errcode = '22023';
  end if;

  select cash_account.ledger_account_id
  into source_ledger_account_id
  from public.cash_bank_accounts cash_account
  join public.accounts ledger_account on ledger_account.id = cash_account.ledger_account_id
  where cash_account.id = p_source_account_id
    and cash_account.is_active
    and cash_account.currency_code = 'EGP'
    and ledger_account.is_active
    and ledger_account.is_postable
    and ledger_account.account_type = 'asset'
  for update of cash_account;

  if source_ledger_account_id is null then
    raise exception 'Source cash or bank account is unavailable' using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.accounts offset_account
    where offset_account.id = p_offset_account_id
      and offset_account.is_active
      and offset_account.is_postable
  ) then
    raise exception 'Offset account is unavailable' using errcode = '23503';
  end if;

  if source_ledger_account_id = p_offset_account_id then
    raise exception 'Source and offset ledger accounts must be different' using errcode = '23514';
  end if;

  insert into public.cash_bank_transactions (
    transaction_date,
    transaction_type,
    source_account_id,
    amount,
    description,
    reference_number,
    status,
    created_by,
    client_request_id
  ) values (
    p_transaction_date,
    'withdrawal',
    p_source_account_id,
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
      and movement.transaction_type = 'withdrawal';

    if generated_transaction_id is null then
      raise exception 'Request identifier is already in use' using errcode = '23505';
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
  ) values (
    p_transaction_date,
    btrim(p_description),
    'draft',
    'cash_bank_withdrawal',
    generated_transaction_id,
    (select auth.uid())
  ) returning id into generated_journal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    description,
    debit,
    credit,
    created_by
  ) values
    (
      generated_journal_id,
      1,
      p_offset_account_id,
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
  set status = 'posted', journal_id = generated_journal_id, posted_at = now()
  where id = generated_transaction_id;

  return generated_transaction_id;
end;
$function$;

create or replace function public.post_cash_bank_transfer(
  p_client_request_id uuid,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_description text,
  p_reference_number text default null::text
)
returns uuid
language plpgsql
set search_path to 'public'
as $function$
declare
  generated_transaction_id uuid;
  generated_journal_id uuid;
  source_ledger_account_id uuid;
  destination_ledger_account_id uuid;
  normalized_amount numeric(18, 2);
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to post cash or bank transfers' using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_source_account_id is null
    or p_destination_account_id is null
    or p_transaction_date is null
    or btrim(coalesce(p_description, '')) = '' then
    raise exception 'Request, accounts, date, and description are required' using errcode = '22023';
  end if;

  if p_source_account_id = p_destination_account_id then
    raise exception 'Source and destination accounts must be different' using errcode = '23514';
  end if;

  normalized_amount := round(p_amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero' using errcode = '22023';
  end if;

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
    raise exception 'Source or destination cash/bank account is unavailable' using errcode = '23503';
  end if;

  if source_ledger_account_id = destination_ledger_account_id then
    raise exception 'Source and destination ledger accounts must be different' using errcode = '23514';
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
  ) values (
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
      raise exception 'Request identifier is already in use' using errcode = '23505';
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
  ) values (
    p_transaction_date,
    btrim(p_description),
    'draft',
    'cash_bank_transfer',
    generated_transaction_id,
    (select auth.uid())
  ) returning id into generated_journal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    description,
    debit,
    credit,
    created_by
  ) values
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
  set status = 'posted', journal_id = generated_journal_id, posted_at = now()
  where id = generated_transaction_id;

  return generated_transaction_id;
end;
$function$;

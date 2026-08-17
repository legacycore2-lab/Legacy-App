create or replace function public.create_cash_bank_account_with_ledger(
  p_name text,
  p_account_kind text,
  p_bank_name text,
  p_account_number text,
  p_iban text,
  p_branch_name text,
  p_opening_balance numeric,
  p_currency_code text,
  p_is_active boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_role text;
  v_parent public.accounts%rowtype;
  v_ledger_account_id uuid;
  v_cash_bank_account_id uuid;
  v_next_suffix integer;
  v_ledger_code text;
begin
  v_role := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer');

  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Only finance users can create cash or bank accounts'
      using errcode = '42501';
  end if;

  if length(btrim(coalesce(p_name, ''))) = 0 then
    raise exception 'Account name is required' using errcode = '23514';
  end if;

  if p_account_kind not in ('cash', 'bank') then
    raise exception 'Account kind must be cash or bank' using errcode = '23514';
  end if;

  if p_opening_balance is null or p_opening_balance < 0 then
    raise exception 'Opening balance cannot be negative' using errcode = '23514';
  end if;

  if p_currency_code is distinct from 'EGP' then
    raise exception 'Only EGP is supported' using errcode = '23514';
  end if;

  if p_account_kind = 'cash'
    and (p_bank_name is not null or p_account_number is not null or p_iban is not null or p_branch_name is not null) then
    raise exception 'Cash accounts cannot include bank details' using errcode = '23514';
  end if;

  select account.*
  into v_parent
  from public.accounts account
  where account.code = '1100'
    and account.account_type = 'asset'
    and account.is_active
  for update;

  if v_parent.id is null then
    raise exception 'The active 1100 cash and banks parent account was not found'
      using errcode = '23503';
  end if;

  if v_parent.level >= 10 then
    raise exception 'The cash and banks account cannot accept another level'
      using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('create_cash_bank_account_with_ledger:1100', 0)
  );

  select coalesce(max(substring(account.code from '^1100-([0-9]+)$')::integer), 0) + 1
  into v_next_suffix
  from public.accounts account
  where account.parent_id = v_parent.id
    and account.code ~ '^1100-[0-9]+$';

  v_ledger_code := '1100-' || lpad(v_next_suffix::text, 3, '0');

  insert into public.accounts (
    code,
    name_ar,
    name_en,
    account_type,
    normal_balance,
    parent_id,
    level,
    is_postable,
    is_active,
    created_by
  )
  values (
    v_ledger_code,
    btrim(p_name),
    nullif(btrim(coalesce(p_bank_name, '')), ''),
    'asset',
    'debit',
    v_parent.id,
    v_parent.level + 1,
    true,
    true,
    (select auth.uid())
  )
  returning id into v_ledger_account_id;

  insert into public.cash_bank_accounts (
    ledger_account_id,
    name,
    account_kind,
    bank_name,
    account_number,
    iban,
    branch_name,
    opening_balance,
    currency_code,
    is_active,
    created_by
  )
  values (
    v_ledger_account_id,
    btrim(p_name),
    p_account_kind,
    nullif(btrim(coalesce(p_bank_name, '')), ''),
    nullif(btrim(coalesce(p_account_number, '')), ''),
    nullif(btrim(coalesce(p_iban, '')), ''),
    nullif(btrim(coalesce(p_branch_name, '')), ''),
    p_opening_balance,
    p_currency_code,
    coalesce(p_is_active, true),
    (select auth.uid())
  )
  returning id into v_cash_bank_account_id;

  return v_cash_bank_account_id;
end;
$function$;

revoke all on function public.create_cash_bank_account_with_ledger(
  text, text, text, text, text, text, numeric, text, boolean
) from public;
revoke execute on function public.create_cash_bank_account_with_ledger(
  text, text, text, text, text, text, numeric, text, boolean
) from anon;
grant execute on function public.create_cash_bank_account_with_ledger(
  text, text, text, text, text, text, numeric, text, boolean
) to authenticated;

comment on function public.create_cash_bank_account_with_ledger(
  text, text, text, text, text, text, numeric, text, boolean
) is 'Atomically creates a postable ledger account under 1100 and its linked cash/bank operational account.';

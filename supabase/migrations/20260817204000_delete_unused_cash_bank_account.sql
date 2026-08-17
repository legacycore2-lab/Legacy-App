create or replace function public.delete_unused_cash_bank_account(
  p_cash_bank_account_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text;
  v_ledger_account_id uuid;
  v_ledger_code text;
  v_parent_code text;
  v_opening_balance numeric;
begin
  if p_cash_bank_account_id is null then
    raise exception 'معرّف الحساب مطلوب.' using errcode = '22023';
  end if;

  v_role := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer');

  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'ليس لديك صلاحية حذف حسابات الخزنة والبنوك.' using errcode = '42501';
  end if;

  select operational.ledger_account_id, operational.opening_balance
  into v_ledger_account_id, v_opening_balance
  from public.cash_bank_accounts operational
  where operational.id = p_cash_bank_account_id
  for update;

  if not found then
    raise exception 'الحساب المطلوب غير موجود.' using errcode = 'P0002';
  end if;

  if coalesce(v_opening_balance, 0) <> 0 then
    raise exception 'لا يمكن حذف حساب له رصيد افتتاحي. يمكنك إيقافه بدلًا من ذلك.' using errcode = '23503';
  end if;

  if exists (
    select 1
    from public.cash_bank_transactions movement
    where movement.source_account_id = p_cash_bank_account_id
       or movement.destination_account_id = p_cash_bank_account_id
  ) then
    raise exception 'لا يمكن حذف حساب مرتبط بحركات مالية. يمكنك إيقافه بدلًا من ذلك.' using errcode = '23503';
  end if;

  select ledger.code, parent.code
  into v_ledger_code, v_parent_code
  from public.accounts ledger
  left join public.accounts parent on parent.id = ledger.parent_id
  where ledger.id = v_ledger_account_id
  for update of ledger;

  delete from public.cash_bank_accounts
  where id = p_cash_bank_account_id;

  -- Only ledger accounts created by the automatic workflow use this reserved
  -- code convention. Existing accounts linked by the user remain untouched.
  if v_parent_code = '1100' and v_ledger_code ~ '^1100-[0-9]{3}$' then
    if exists (
      select 1 from public.journal_lines line where line.account_id = v_ledger_account_id
    ) or exists (
      select 1 from public.accounts child where child.parent_id = v_ledger_account_id
    ) then
      raise exception 'لا يمكن حذف حساب أستاذ مرتبط بقيود أو حسابات فرعية. يمكنك إيقافه بدلًا من ذلك.' using errcode = '23503';
    end if;

    delete from public.accounts where id = v_ledger_account_id;
  end if;
end;
$$;

revoke all on function public.delete_unused_cash_bank_account(uuid) from public;
revoke all on function public.delete_unused_cash_bank_account(uuid) from anon;
grant execute on function public.delete_unused_cash_bank_account(uuid) to authenticated;

comment on function public.delete_unused_cash_bank_account(uuid) is
  'Atomically deletes an unused cash/bank account and its automatically generated ledger account; accounts with opening balances or financial history are rejected.';

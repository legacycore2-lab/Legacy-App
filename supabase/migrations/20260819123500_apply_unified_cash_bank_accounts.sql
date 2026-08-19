-- Re-apply the unified Cash & Banks / Chart of Accounts database contract
-- with a migration version newer than the already-applied production migrations.
-- The original 20260819073500 migration was merged after production had already
-- advanced to 20260819095000, so it was never applied there.

create or replace function public.create_ledger_with_cash_bank_account(
  p_code text,
  p_name_ar text,
  p_name_en text,
  p_parent_id uuid,
  p_account_kind text,
  p_is_active boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text;
  v_parent public.accounts%rowtype;
  v_account_id uuid;
begin
  v_role := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer');
  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'ليس لديك صلاحية إنشاء حسابات الخزنة والبنوك.' using errcode = '42501';
  end if;

  if length(btrim(coalesce(p_code, ''))) = 0 or length(btrim(coalesce(p_name_ar, ''))) = 0 then
    raise exception 'كود الحساب والاسم العربي مطلوبان.' using errcode = '23514';
  end if;
  if p_account_kind not in ('cash', 'bank') then
    raise exception 'نوع الحساب التشغيلي يجب أن يكون خزنة أو بنك.' using errcode = '23514';
  end if;

  select * into v_parent
  from public.accounts
  where id = p_parent_id
    and code = '1100'
    and account_type = 'asset'
    and is_active
    and deleted_at is null
  for update;

  if not found then
    raise exception 'حسابات الخزنة والبنوك يجب إنشاؤها مباشرة تحت 1100 — النقدية والبنوك.' using errcode = '23503';
  end if;

  insert into public.accounts (
    code, name_ar, name_en, account_type, normal_balance, parent_id,
    level, is_postable, is_active, created_by
  ) values (
    btrim(p_code), btrim(p_name_ar), nullif(btrim(coalesce(p_name_en, '')), ''),
    'asset', 'debit', v_parent.id, v_parent.level + 1, true, coalesce(p_is_active, true), auth.uid()
  ) returning id into v_account_id;

  insert into public.cash_bank_accounts (
    ledger_account_id, name, account_kind, bank_name, opening_balance,
    currency_code, is_active, created_by
  ) values (
    v_account_id, btrim(p_name_ar), p_account_kind,
    case when p_account_kind = 'bank' then nullif(btrim(coalesce(p_name_en, '')), '') else null end,
    0, 'EGP', coalesce(p_is_active, true), auth.uid()
  );

  return v_account_id;
end;
$$;

revoke all on function public.create_ledger_with_cash_bank_account(text, text, text, uuid, text, boolean) from public;
revoke all on function public.create_ledger_with_cash_bank_account(text, text, text, uuid, text, boolean) from anon;
grant execute on function public.create_ledger_with_cash_bank_account(text, text, text, uuid, text, boolean) to authenticated;

create or replace function public.delete_unused_cash_bank_account_by_ledger(p_ledger_account_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text;
  v_operational_id uuid;
  v_opening_balance numeric;
begin
  v_role := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer');
  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'ليس لديك صلاحية حذف حسابات الخزنة والبنوك.' using errcode = '42501';
  end if;

  select id, opening_balance into v_operational_id, v_opening_balance
  from public.cash_bank_accounts
  where ledger_account_id = p_ledger_account_id
  for update;

  if not found then
    raise exception 'الحساب غير مرتبط بالخزنة والبنوك.' using errcode = 'P0002';
  end if;
  if coalesce(v_opening_balance, 0) <> 0 then
    raise exception 'لا يمكن حذف حساب له رصيد افتتاحي. يمكنك إيقافه بدلًا من ذلك.' using errcode = '23503';
  end if;
  if exists (
    select 1 from public.cash_bank_transactions
    where source_account_id = v_operational_id or destination_account_id = v_operational_id
  ) then
    raise exception 'لا يمكن حذف حساب مرتبط بحركات مالية. يمكنك إيقافه بدلًا من ذلك.' using errcode = '23503';
  end if;
  if exists (select 1 from public.journal_lines where account_id = p_ledger_account_id) then
    raise exception 'لا يمكن حذف حساب مستخدم في قيود يومية. يمكنك إيقافه بدلًا من ذلك.' using errcode = '23503';
  end if;
  if exists (select 1 from public.advances where advance_ledger_account_id = p_ledger_account_id) then
    raise exception 'لا يمكن حذف حساب مرتبط بالعوهد. يمكنك إيقافه بدلًا من ذلك.' using errcode = '23503';
  end if;
  if exists (select 1 from public.accounts where parent_id = p_ledger_account_id and deleted_at is null) then
    raise exception 'لا يمكن حذف حساب يحتوي على حسابات فرعية.' using errcode = '23503';
  end if;

  delete from public.cash_bank_accounts where id = v_operational_id;
  delete from public.accounts where id = p_ledger_account_id;
end;
$$;

revoke all on function public.delete_unused_cash_bank_account_by_ledger(uuid) from public;
revoke all on function public.delete_unused_cash_bank_account_by_ledger(uuid) from anon;
grant execute on function public.delete_unused_cash_bank_account_by_ledger(uuid) to authenticated;

create or replace function public.delete_unused_cash_bank_account(p_cash_bank_account_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ledger_account_id uuid;
begin
  select ledger_account_id into v_ledger_account_id
  from public.cash_bank_accounts
  where id = p_cash_bank_account_id;

  if not found then
    raise exception 'الحساب المطلوب غير موجود.' using errcode = 'P0002';
  end if;

  perform public.delete_unused_cash_bank_account_by_ledger(v_ledger_account_id);
end;
$$;

revoke all on function public.delete_unused_cash_bank_account(uuid) from public;
revoke all on function public.delete_unused_cash_bank_account(uuid) from anon;
grant execute on function public.delete_unused_cash_bank_account(uuid) to authenticated;

create or replace function public.sync_account_to_cash_bank()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.cash_bank_accounts
  set name = new.name_ar,
      is_active = new.is_active
  where ledger_account_id = new.id
    and (name is distinct from new.name_ar or is_active is distinct from new.is_active);
  return new;
end;
$$;

create or replace function public.sync_cash_bank_to_account()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.accounts
  set name_ar = new.name,
      is_active = new.is_active
  where id = new.ledger_account_id
    and deleted_at is null
    and (name_ar is distinct from new.name or is_active is distinct from new.is_active);
  return new;
end;
$$;

drop trigger if exists accounts_sync_cash_bank on public.accounts;
create trigger accounts_sync_cash_bank
after update of name_ar, is_active on public.accounts
for each row execute function public.sync_account_to_cash_bank();

drop trigger if exists cash_bank_sync_accounts on public.cash_bank_accounts;
create trigger cash_bank_sync_accounts
after update of name, is_active on public.cash_bank_accounts
for each row execute function public.sync_cash_bank_to_account();

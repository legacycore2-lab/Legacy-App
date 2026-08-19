-- Preserve Cash & Banks identity on the ledger account so soft-deleted accounts
-- can be restored to both Chart of Accounts and Cash & Banks atomically.

alter table public.accounts
  add column if not exists cash_bank_kind text;

alter table public.accounts
  drop constraint if exists accounts_cash_bank_kind_check;

alter table public.accounts
  add constraint accounts_cash_bank_kind_check
  check (cash_bank_kind is null or cash_bank_kind in ('cash', 'bank'));

update public.accounts a
set cash_bank_kind = cba.account_kind
from public.cash_bank_accounts cba
where cba.ledger_account_id = a.id
  and a.cash_bank_kind is distinct from cba.account_kind;

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
    level, is_postable, is_active, cash_bank_kind, created_by
  ) values (
    btrim(p_code), btrim(p_name_ar), nullif(btrim(coalesce(p_name_en, '')), ''),
    'asset', 'debit', v_parent.id, v_parent.level + 1, true,
    coalesce(p_is_active, true), p_account_kind, auth.uid()
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
  v_account_kind text;
begin
  v_role := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer');
  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'ليس لديك صلاحية حذف حسابات الخزنة والبنوك.' using errcode = '42501';
  end if;

  select id, opening_balance, account_kind
  into v_operational_id, v_opening_balance, v_account_kind
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

  update public.accounts
  set cash_bank_kind = v_account_kind,
      is_active = false,
      deleted_at = now()
  where id = p_ledger_account_id;

  delete from public.cash_bank_accounts where id = v_operational_id;
end;
$$;

create or replace function public.restore_account_with_cash_bank(
  p_account_id uuid,
  p_account_kind text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text;
  v_account public.accounts%rowtype;
  v_parent_code text;
  v_kind text;
begin
  v_role := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer');
  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'ليس لديك صلاحية استعادة الحسابات.' using errcode = '42501';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
  for update;

  if not found then
    raise exception 'الحساب غير موجود.' using errcode = 'P0002';
  end if;
  if v_account.deleted_at is null then
    raise exception 'الحساب غير محذوف.' using errcode = '23514';
  end if;

  if v_account.parent_id is not null then
    select code into v_parent_code
    from public.accounts
    where id = v_account.parent_id
      and deleted_at is null
      and is_active;
    if not found then
      raise exception 'استعد أو فعّل الحساب الرئيسي أولًا.' using errcode = '23503';
    end if;
  end if;

  v_kind := coalesce(v_account.cash_bank_kind, p_account_kind);

  if v_parent_code = '1100' and v_account.account_type = 'asset' and v_account.is_postable then
    if v_kind not in ('cash', 'bank') then
      raise exception 'حدد هل الحساب بنك أم خزنة قبل الاستعادة.' using errcode = '23514';
    end if;

    if not exists (
      select 1 from public.cash_bank_accounts where ledger_account_id = p_account_id
    ) then
      insert into public.cash_bank_accounts (
        ledger_account_id, name, account_kind, bank_name, opening_balance,
        currency_code, is_active, created_by
      ) values (
        p_account_id, v_account.name_ar, v_kind,
        case when v_kind = 'bank' then nullif(btrim(coalesce(v_account.name_en, '')), '') else null end,
        0, 'EGP', true, auth.uid()
      );
    else
      update public.cash_bank_accounts
      set name = v_account.name_ar,
          account_kind = v_kind,
          is_active = true
      where ledger_account_id = p_account_id;
    end if;

    update public.accounts
    set cash_bank_kind = v_kind,
        deleted_at = null,
        is_active = true
    where id = p_account_id;
  else
    update public.accounts
    set deleted_at = null,
        is_active = true
    where id = p_account_id;
  end if;
end;
$$;

revoke all on function public.restore_account_with_cash_bank(uuid, text) from public;
revoke all on function public.restore_account_with_cash_bank(uuid, text) from anon;
grant execute on function public.restore_account_with_cash_bank(uuid, text) to authenticated;

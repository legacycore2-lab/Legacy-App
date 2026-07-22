-- Legacy Core ERP
-- Seed the smallest balanced chart of accounts required for single-line posting.
-- Codes are stable business identifiers; the migration is safe to retry.

begin;

insert into public.accounts
  (code, name_ar, name_en, account_type, normal_balance, parent_id, level, is_postable, is_active)
values
  ('1000', 'الأصول', 'Assets', 'asset', 'debit', null, 1, false, true),
  ('4000', 'الإيرادات', 'Revenue', 'revenue', 'credit', null, 1, false, true),
  ('5000', 'المصروفات', 'Expenses', 'expense', 'debit', null, 1, false, true)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  account_type = excluded.account_type,
  normal_balance = excluded.normal_balance,
  parent_id = null,
  level = 1,
  is_postable = false,
  is_active = true;

insert into public.accounts
  (code, name_ar, name_en, account_type, normal_balance, parent_id, level, is_postable, is_active)
select '1100', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'debit', id, 2, false, true
from public.accounts
where code = '1000'
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  account_type = excluded.account_type,
  normal_balance = excluded.normal_balance,
  parent_id = excluded.parent_id,
  level = 2,
  is_postable = false,
  is_active = true;

insert into public.accounts
  (code, name_ar, name_en, account_type, normal_balance, parent_id, level, is_postable, is_active)
select '1110', 'البنك', 'Bank', 'asset', 'debit', id, 3, true, true
from public.accounts
where code = '1100'
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  account_type = excluded.account_type,
  normal_balance = excluded.normal_balance,
  parent_id = excluded.parent_id,
  level = 3,
  is_postable = true,
  is_active = true;

insert into public.accounts
  (code, name_ar, name_en, account_type, normal_balance, parent_id, level, is_postable, is_active)
select '4100', 'إيرادات عامة', 'General Revenue', 'revenue', 'credit', id, 2, true, true
from public.accounts
where code = '4000'
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  account_type = excluded.account_type,
  normal_balance = excluded.normal_balance,
  parent_id = excluded.parent_id,
  level = 2,
  is_postable = true,
  is_active = true;

insert into public.accounts
  (code, name_ar, name_en, account_type, normal_balance, parent_id, level, is_postable, is_active)
select '5100', 'خرسانة', 'Concrete', 'expense', 'debit', id, 2, true, true
from public.accounts
where code = '5000'
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  account_type = excluded.account_type,
  normal_balance = excluded.normal_balance,
  parent_id = excluded.parent_id,
  level = 2,
  is_postable = true,
  is_active = true;

commit;

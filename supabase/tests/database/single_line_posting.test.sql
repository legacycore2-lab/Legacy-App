-- Finance Roles V3 contract: the legacy text-based overload
-- post_single_line_entry(date,text,text,text,text,text,text,numeric) is intentionally
-- unreachable.  All callers must use the id-based overload tested in
-- id_based_single_line_posting.test.sql.
begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

insert into auth.users (id, email, raw_app_meta_data)
values (
  '70000000-0000-0000-0000-000000000001',
  'accountant@test.local',
  '{"role":"accountant"}'::jsonb
) on conflict (id) do nothing;

insert into public.projects (id, name)
values ('71000000-0000-0000-0000-000000000001', 'مشروع القيد الواحد')
on conflict (id) do nothing;

insert into public.accounts (
  id, code, name_ar, account_type, normal_balance, level, is_postable
)
values
  ('72000000-0000-0000-0000-000000000001', '95100', 'مصروفات الموقع', 'expense', 'debit', 1, true),
  ('72000000-0000-0000-0000-000000000002', '91100', 'الخزنة', 'asset', 'debit', 1, true)
on conflict (id) do nothing;

-- V3: legacy 8-param overload has EXECUTE revoked from all roles.
-- accountant receives permission-denied, not a successful post.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select throws_ok(
  $$select public.post_single_line_entry(
      current_date,
      'مشروع القيد الواحد',
      'expense',
      '95100',
      'شراء خامات',
      'مورد الاختبار',
      '91100',
      1250
    )$$,
  '42501',
  null,
  'V3: legacy post_single_line_entry is unreachable by accountant'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"viewer"}}',
  true
);

select throws_ok(
  $$select public.post_single_line_entry(
      current_date,
      'مشروع القيد الواحد',
      'expense',
      '95100',
      'عملية مرفوضة',
      '',
      '91100',
      100
    )$$,
  '42501',
  null,
  'V3: legacy post_single_line_entry is unreachable by viewer'
);

reset role;
select * from finish();
rollback;

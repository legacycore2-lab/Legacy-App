begin;

select plan(6);

insert into auth.users (id, email, raw_app_meta_data)
values (
  '70000000-0000-0000-0000-000000000001',
  'accountant@test.local',
  '{"role":"accountant"}'::jsonb
);

insert into public.projects (id, name)
values ('71000000-0000-0000-0000-000000000001', 'مشروع القيد الواحد');

insert into public.accounts (
  id, code, name_ar, account_type, normal_balance, level, is_postable
)
values
  (
    '72000000-0000-0000-0000-000000000001',
    '95100',
    'مصروفات الموقع',
    'expense',
    'debit',
    1,
    true
  ),
  (
    '72000000-0000-0000-0000-000000000002',
    '91100',
    'الخزنة',
    'asset',
    'debit',
    1,
    true
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select lives_ok(
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
  'accountant can post one user-facing line'
);

reset role;

select is(
  (select count(*) from public.entries where description = 'شراء خامات'),
  1::bigint,
  'one legacy entry is created for the journal list'
);

select is(
  (select status from public.journals where description = 'شراء خامات'),
  'posted',
  'generated journal is posted'
);

select is(
  (select count(*) from public.journal_lines line
    join public.journals journal on journal.id = line.journal_id
    where journal.description = 'شراء خامات'),
  2::bigint,
  'exactly two journal lines are generated'
);

select is(
  (select sum(line.debit) from public.journal_lines line
    join public.journals journal on journal.id = line.journal_id
    where journal.description = 'شراء خامات'),
  (select sum(line.credit) from public.journal_lines line
    join public.journals journal on journal.id = line.journal_id
    where journal.description = 'شراء خامات'),
  'generated debit equals generated credit'
);

set local role authenticated;
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
  'Insufficient permissions to post journal entries',
  'viewer cannot post a single-line entry'
);

reset role;
select * from finish();
rollback;

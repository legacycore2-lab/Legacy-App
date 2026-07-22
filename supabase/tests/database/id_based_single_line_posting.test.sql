begin;

select plan(7);

insert into auth.users (id, email, raw_app_meta_data)
values (
  '70000000-0000-0000-0000-000000000011',
  'id-accountant@test.local',
  '{"role":"accountant"}'::jsonb
);

insert into public.projects (id, name)
values ('71000000-0000-0000-0000-000000000011', 'مشروع الربط بالمعرف');

insert into public.accounts (id, code, name_ar, account_type, normal_balance, level, is_postable)
values
  ('72000000-0000-0000-0000-000000000011', '95200', 'مصروفات المعرف', 'expense', 'debit', 1, true),
  ('72000000-0000-0000-0000-000000000012', '91200', 'خزنة المعرف', 'asset', 'debit', 1, true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000011","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select lives_ok(
  $$select public.post_single_line_entry(
    '73000000-0000-0000-0000-000000000011',
    current_date,
    '71000000-0000-0000-0000-000000000011',
    'expense',
    '72000000-0000-0000-0000-000000000011',
    'شراء بالمعرف',
    'مورد الاختبار',
    '72000000-0000-0000-0000-000000000012',
    500
  )$$,
  'accountant can post using stable identifiers'
);

select lives_ok(
  $$select public.post_single_line_entry(
    '73000000-0000-0000-0000-000000000011',
    current_date,
    '71000000-0000-0000-0000-000000000011',
    'expense',
    '72000000-0000-0000-0000-000000000011',
    'شراء بالمعرف',
    'مورد الاختبار',
    '72000000-0000-0000-0000-000000000012',
    500
  )$$,
  'retrying the same request succeeds idempotently'
);

reset role;

select is((select count(*) from public.entries where description = 'شراء بالمعرف'), 1::bigint, 'one entry is created');
select is((select count(*) from public.journals where description = 'شراء بالمعرف'), 1::bigint, 'one journal is created');
select is(
  (select count(*) from public.journal_lines line join public.journals journal on journal.id = line.journal_id where journal.description = 'شراء بالمعرف'),
  2::bigint,
  'two journal lines are created'
);
select is(
  (select sum(line.debit) from public.journal_lines line join public.journals journal on journal.id = line.journal_id where journal.description = 'شراء بالمعرف'),
  (select sum(line.credit) from public.journal_lines line join public.journals journal on journal.id = line.journal_id where journal.description = 'شراء بالمعرف'),
  'debit equals credit'
);
select is(
  (select project_id from public.entries where description = 'شراء بالمعرف'),
  '71000000-0000-0000-0000-000000000011'::uuid,
  'entry keeps the selected project identifier'
);

select * from finish();
rollback;

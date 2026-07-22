begin;

select plan(7);

insert into auth.users (id, email, raw_app_meta_data)
values (
  '70000000-0000-0000-0000-000000000020',
  'reversal-accountant@test.local',
  '{"role":"accountant"}'::jsonb
);

insert into public.projects (id, name)
values ('71000000-0000-0000-0000-000000000020', 'مشروع العكس');

insert into public.accounts (id, code, name_ar, account_type, normal_balance, level, is_postable)
values
  ('72000000-0000-0000-0000-000000000020', '95300', 'مصروفات العكس', 'expense', 'debit', 1, true),
  ('72000000-0000-0000-0000-000000000021', '91300', 'خزنة العكس', 'asset', 'debit', 1, true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000020","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select lives_ok(
  $$select public.post_single_line_entry(
    '73000000-0000-0000-0000-000000000020',
    current_date,
    '71000000-0000-0000-0000-000000000020',
    'expense',
    '72000000-0000-0000-0000-000000000020',
    'مصروف للعكس',
    'مورد الاختبار',
    '72000000-0000-0000-0000-000000000021',
    750
  )$$,
  'accountant can post entry before reversal'
);

reset role;

select is(
  (select status from public.journals where description = 'مصروف للعكس'),
  'posted',
  'entry status is posted before reversal'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000020","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select lives_ok(
  $$select public.reverse_journal_entry(
    (select id from public.entries where description = 'مصروف للعكس')
  )$$,
  'accountant can reverse a posted entry'
);

reset role;

select is(
  (select status from public.journals where description = 'مصروف للعكس'),
  'reversed',
  'original journal status becomes reversed'
);

select is(
  (select count(*) from public.journals where description = 'عكس: مصروف للعكس'),
  1::bigint,
  'reversal journal is created'
);

select is(
  (select sum(debit) from public.journal_lines
   join public.journals on journals.id = journal_lines.journal_id
   where journals.description = 'عكس: مصروف للعكس'),
  (select sum(credit) from public.journal_lines
   join public.journals on journals.id = journal_lines.journal_id
   where journals.description = 'عكس: مصروف للعكس'),
  'reversal lines are balanced'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000020","role":"authenticated","app_metadata":{"role":"viewer"}}',
  true
);

select throws_ok(
  $$select public.reverse_journal_entry(
    (select id from public.entries where description = 'مصروف للعكس')
  )$$,
  '42501',
  'Insufficient permissions to reverse journal entries',
  'viewer cannot reverse an entry'
);

reset role;

select * from finish();
rollback;

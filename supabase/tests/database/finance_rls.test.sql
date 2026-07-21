begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

select has_table('public', 'projects', 'projects exists after migration replay');
select has_table('public', 'entries', 'entries exists after migration replay');
select has_table('public', 'accounts', 'accounts exists after migration replay');
select has_table('public', 'journals', 'journals exists after migration replay');
select has_table('public', 'journal_lines', 'journal lines exist after migration replay');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.projects'::regclass),
  'projects RLS is enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.accounts'::regclass),
  'accounts RLS is enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.journals'::regclass),
  'journals RLS is enabled'
);

insert into public.projects (id, name)
values ('10000000-0000-0000-0000-000000000001', 'RLS fixture');

insert into public.accounts (
  id, code, name_ar, account_type, normal_balance, level, is_postable
)
values (
  '20000000-0000-0000-0000-000000000001',
  '1000',
  'حساب اختبار',
  'asset',
  'debit',
  1,
  true
);

insert into public.journals (
  id, journal_date, description, status, created_by
)
values (
  '30000000-0000-0000-0000-000000000001',
  current_date,
  'RLS fixture journal',
  'draft',
  null
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"viewer"}}',
  true
);

select is(
  (select count(*) from public.projects),
  1::bigint,
  'viewer can read projects'
);
select is(
  (select count(*) from public.accounts),
  1::bigint,
  'viewer can read chart of accounts'
);
select is(
  (select count(*) from public.journals),
  0::bigint,
  'viewer cannot read journals'
);

select throws_ok(
  $$insert into public.projects (name) values ('Forbidden viewer project')$$,
  '42501',
  'new row violates row-level security policy for table "projects"',
  'viewer cannot create projects'
);

select throws_ok(
  $$insert into public.accounts (code, name_ar, account_type, normal_balance, level, is_postable)
    values ('1001', 'مرفوض', 'asset', 'debit', 1, true)$$,
  '42501',
  'new row violates row-level security policy for table "accounts"',
  'viewer cannot create accounts'
);

select throws_ok(
  $$select public.reverse_posted_journal('30000000-0000-0000-0000-000000000001')$$,
  '42501',
  'Insufficient permissions to reverse journals',
  'viewer cannot invoke journal reversal'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select lives_ok(
  $$insert into public.projects (id, name)
    values ('10000000-0000-0000-0000-000000000002', 'Accountant project')$$,
  'accountant can create projects'
);

reset role;

select * from finish();
rollback;

begin;

select plan(14);

insert into auth.users (id, email, raw_app_meta_data)
values (
  '80000000-0000-0000-0000-000000000001',
  'accounting-delete-admin@test.local',
  '{"role":"admin"}'::jsonb
);

insert into public.projects (id, name)
values ('81000000-0000-0000-0000-000000000001', 'Accounting delete project');

insert into public.accounts (id, code, name_ar, account_type, normal_balance, level, is_postable)
values
  ('82000000-0000-0000-0000-000000000001', '95800', 'Accounting delete expense', 'expense', 'debit', 1, true),
  ('82000000-0000-0000-0000-000000000002', '91800', 'Accounting delete bank', 'asset', 'debit', 1, true);

insert into public.cash_bank_accounts (
  id,
  ledger_account_id,
  name,
  account_kind,
  opening_balance,
  currency_code,
  is_active
)
values (
  '83000000-0000-0000-0000-000000000001',
  '82000000-0000-0000-0000-000000000002',
  'Accounting delete bank',
  'bank',
  1000,
  'EGP',
  true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);

select public.post_single_line_entry(
  '84000000-0000-0000-0000-000000000001',
  current_date,
  '81000000-0000-0000-0000-000000000001',
  'expense',
  '82000000-0000-0000-0000-000000000001',
  'Erroneous accounting-delete expense',
  'Test supplier',
  '82000000-0000-0000-0000-000000000002',
  200
);

reset role;

insert into public.cash_bank_transactions (
  id,
  transaction_date,
  transaction_type,
  source_account_id,
  amount,
  description,
  reference_number,
  status,
  journal_id,
  posted_at,
  created_by,
  client_request_id
)
select
  '85000000-0000-0000-0000-000000000001',
  current_date,
  'withdrawal',
  '83000000-0000-0000-0000-000000000001',
  200,
  'Erroneous accounting-delete expense',
  entry.id::text,
  'posted',
  journal.id,
  now(),
  '80000000-0000-0000-0000-000000000001',
  '86000000-0000-0000-0000-000000000001'
from public.entries entry
join public.journals journal
  on journal.source_type = 'single_line_entry'
 and journal.source_id = entry.id
where entry.description = 'Erroneous accounting-delete expense';

select is(
  (select current_balance from public.cash_bank_account_balances where id = '83000000-0000-0000-0000-000000000001'),
  800.00::numeric,
  'posted movement affects the bank balance before deletion'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.accounting_delete_single_line_entry(uuid,text)',
    'EXECUTE'
  ),
  'authenticated callers may execute accounting delete'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where p.oid = 'public.accounting_delete_single_line_entry(uuid,text)'::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute accounting delete'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.force_delete_single_line_entry(uuid,text)',
    'EXECUTE'
  ),
  'legacy force-delete RPC is no longer exposed'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select throws_ok(
  $$select public.accounting_delete_single_line_entry(
    (select id from public.entries where description = 'Erroneous accounting-delete expense'),
    'Duplicate data entry'
  )$$,
  '42501',
  'Only administrators can accounting-delete journal entries',
  'accountants cannot accounting-delete entries'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);

select lives_ok(
  $$select public.accounting_delete_single_line_entry(
    (select id from public.entries where description = 'Erroneous accounting-delete expense'),
    'Duplicate data entry'
  )$$,
  'admin can atomically accounting-delete the entry'
);

reset role;

select is(
  (select count(*) from public.entries where description = 'Erroneous accounting-delete expense'),
  0::bigint,
  'operational entry is removed'
);

select is(
  (select count(*) from public.journals where description = 'Erroneous accounting-delete expense'),
  0::bigint,
  'linked journal is removed'
);

select is(
  (select count(*) from public.cash_bank_transactions where id = '85000000-0000-0000-0000-000000000001'),
  0::bigint,
  'linked cash-bank movement is removed'
);

select is(
  (select current_balance from public.cash_bank_account_balances where id = '83000000-0000-0000-0000-000000000001'),
  1000.00::numeric,
  'bank balance is restored automatically'
);

select is(
  (select deletion_kind from public.journal_force_delete_audit where reason = 'Duplicate data entry'),
  'accounting_delete',
  'audit record identifies accounting deletion'
);

select ok(
  (select cash_bank_transaction_snapshot is not null
     from public.journal_force_delete_audit
    where reason = 'Duplicate data entry'),
  'audit record preserves the linked cash-bank movement'
);

select ok(
  (select entry_snapshot is not null
      and journal_snapshot is not null
      and jsonb_array_length(lines_snapshot) = 2
     from public.journal_force_delete_audit
    where reason = 'Duplicate data entry'),
  'audit record preserves entry, journal and line snapshots'
);

select is(
  (select deleted_by from public.journal_force_delete_audit where reason = 'Duplicate data entry'),
  '80000000-0000-0000-0000-000000000001'::uuid,
  'audit record preserves the deleting user'
);

select * from finish();

rollback;

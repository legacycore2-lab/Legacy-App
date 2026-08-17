begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, raw_app_meta_data)
values (
  '91000000-0000-0000-0000-000000000001',
  'auto-bank-accountant@example.com',
  '{"role":"accountant"}'::jsonb
)
on conflict (id) do nothing;

insert into public.accounts (
  id, code, name_ar, account_type, normal_balance, level, is_postable, is_active
)
values (
  '91000000-0000-0000-0000-000000000002',
  '1100',
  'النقدية والبنوك',
  'asset',
  'debit',
  2,
  false,
  true
)
on conflict (code) do update set is_active = true;

select has_function(
  'public',
  'create_cash_bank_account_with_ledger',
  array['text','text','text','text','text','text','numeric','text','boolean'],
  'atomic cash/bank account creation RPC exists'
);

select ok(
  not has_function_privilege('anon', 'public.create_cash_bank_account_with_ledger(text,text,text,text,text,text,numeric,text,boolean)', 'execute'),
  'anonymous users cannot execute the RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"accountant"}}',
  true
);

select lives_ok(
  $$select public.create_cash_bank_account_with_ledger(
    'بنك تلقائي', 'bank', 'Test Bank', '123', null, null, 500, 'EGP', true
  )$$,
  'finance user can create both accounts atomically'
);

select is(
  (select count(*) from public.accounts where name_ar = 'بنك تلقائي' and code ~ '^1100-[0-9]+$'),
  1::bigint,
  'one generated postable ledger account is created under 1100'
);

select ok(
  exists (
    select 1
    from public.cash_bank_accounts operational
    join public.accounts ledger on ledger.id = operational.ledger_account_id
    where operational.name = 'بنك تلقائي'
      and ledger.name_ar = 'بنك تلقائي'
      and ledger.is_postable
  ),
  'the operational account is linked to the generated ledger account'
);

select throws_ok(
  $$select public.create_cash_bank_account_with_ledger(
    'بنك تلقائي', 'bank', 'Duplicate', null, null, null, 0, 'EGP', true
  )$$,
  '23505',
  'duplicate key value violates unique constraint "cash_bank_accounts_name_unique"',
  'duplicate operational account name rejects the whole operation'
);

select is(
  (select count(*) from public.accounts where name_ar = 'بنك تلقائي'),
  1::bigint,
  'a failed operational insert leaves no orphan ledger account'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"viewer"}}',
  true
);

select throws_ok(
  $$select public.create_cash_bank_account_with_ledger(
    'مرفوض', 'bank', null, null, null, null, 0, 'EGP', true
  )$$,
  '42501',
  'Only finance users can create cash or bank accounts',
  'viewer cannot execute finance creation logic'
);

select * from finish();
rollback;

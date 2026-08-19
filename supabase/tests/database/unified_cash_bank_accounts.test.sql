begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

select has_function(
  'public',
  'create_ledger_with_cash_bank_account',
  array['text','text','text','uuid','text','boolean'],
  'unified create function exists'
);

select has_function(
  'public',
  'delete_unused_cash_bank_account_by_ledger',
  array['uuid'],
  'unified delete by ledger function exists'
);

do $$
declare
  v_user_id uuid := gen_random_uuid();
  v_parent_id uuid;
  v_ledger_id uuid;
  v_operational_id uuid;
begin
  insert into auth.users (id, email, raw_app_meta_data)
  values (v_user_id, 'unified-cash-bank@example.com', '{"role":"admin"}'::jsonb);

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', v_user_id,
      'role', 'authenticated',
      'app_metadata', json_build_object('role', 'admin')
    )::text,
    true
  );

  select id into v_parent_id from public.accounts where code = '1100' limit 1;

  select public.create_ledger_with_cash_bank_account(
    '1100-TEST', 'خزنة اختبار موحدة', 'Unified Test Cash', v_parent_id, 'cash', true
  ) into v_ledger_id;

  select id into v_operational_id
  from public.cash_bank_accounts
  where ledger_account_id = v_ledger_id;

  perform set_config('test.unified_ledger_id', v_ledger_id::text, true);
  perform set_config('test.unified_operational_id', v_operational_id::text, true);
end;
$$;

select is(
  (select count(*) from public.accounts where id = current_setting('test.unified_ledger_id')::uuid),
  1::bigint,
  'ledger account is created'
);

select is(
  (select count(*) from public.cash_bank_accounts where id = current_setting('test.unified_operational_id')::uuid),
  1::bigint,
  'operational account is created'
);

update public.accounts
set name_ar = 'خزنة اختبار معدلة', is_active = false
where id = current_setting('test.unified_ledger_id')::uuid;

select is(
  (select name from public.cash_bank_accounts where id = current_setting('test.unified_operational_id')::uuid),
  'خزنة اختبار معدلة',
  'ledger name change syncs to cash and banks'
);

update public.cash_bank_accounts
set name = 'خزنة من شاشة البنوك', is_active = true
where id = current_setting('test.unified_operational_id')::uuid;

select is(
  (select name_ar from public.accounts where id = current_setting('test.unified_ledger_id')::uuid),
  'خزنة من شاشة البنوك',
  'cash and banks name change syncs to ledger'
);

select * from finish();
rollback;

begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

select has_function(
  'public',
  'delete_unused_cash_bank_account',
  array['uuid'],
  'unused cash/bank account delete function exists'
);

select function_privs_are(
  'public',
  'delete_unused_cash_bank_account',
  array['uuid'],
  'authenticated',
  array['EXECUTE'],
  'authenticated can execute account delete'
);

select function_privs_are(
  'public',
  'delete_unused_cash_bank_account',
  array['uuid'],
  'anon',
  array[]::text[],
  'anon cannot execute account delete'
);

do $$
declare
  v_user_id uuid := gen_random_uuid();
  v_operational_id uuid;
  v_ledger_id uuid;
begin
  insert into auth.users (id, email, raw_app_meta_data)
  values (v_user_id, 'delete-account-test@example.com', '{"role":"admin"}'::jsonb);
  insert into public.users (id, email, full_name, role, status)
  values (v_user_id, 'delete-account-test@example.com', 'Delete Account Test', 'admin', 'active');
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

  select public.create_cash_bank_account_with_ledger(
    'Temporary bank', 'bank', 'Temporary bank', null, null, null, 0, 'EGP', true
  ) into v_operational_id;

  select ledger_account_id into v_ledger_id
  from public.cash_bank_accounts
  where id = v_operational_id;

  perform public.delete_unused_cash_bank_account(v_operational_id);
  perform set_config('test.deleted_operational_id', v_operational_id::text, true);
  perform set_config('test.deleted_ledger_id', v_ledger_id::text, true);
end;
$$;

select is(
  (select count(*) from public.cash_bank_accounts where id = current_setting('test.deleted_operational_id')::uuid),
  0::bigint,
  'unused operational account is deleted'
);

select is(
  (select count(*) from public.accounts where id = current_setting('test.deleted_ledger_id')::uuid),
  0::bigint,
  'automatically generated ledger account is deleted'
);

select * from finish();
rollback;

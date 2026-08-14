begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

-- The three retired entry points must not be callable by any API role.
select ok(not has_function_privilege('anon', 'public.delete_single_line_entry(uuid)', 'EXECUTE'), 'anon cannot call unsafe delete');
select ok(not has_function_privilege('authenticated', 'public.delete_single_line_entry(uuid)', 'EXECUTE'), 'authenticated cannot call unsafe delete');
select ok(not has_function_privilege('anon', 'public.update_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric)', 'EXECUTE'), 'anon cannot call unsafe update');
select ok(not has_function_privilege('authenticated', 'public.update_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric)', 'EXECUTE'), 'authenticated cannot call unsafe update');
select ok(not has_function_privilege('authenticated', 'public.post_single_line_entry(date,text,text,text,text,text,text,numeric)', 'EXECUTE'), 'legacy posting overload is retired');

-- Supported RPCs are authenticated-only, never PUBLIC/anon.
select ok(has_function_privilege('authenticated', 'public.post_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric)', 'EXECUTE'), 'authenticated can reach supported posting RPC');
select ok(not has_function_privilege('anon', 'public.post_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric)', 'EXECUTE'), 'anon cannot reach supported posting RPC');
select ok(has_function_privilege('authenticated', 'public.reverse_journal_entry(uuid)', 'EXECUTE'), 'authenticated can reach guarded reversal RPC');
select ok(not has_function_privilege('anon', 'public.reverse_journal_entry(uuid)', 'EXECUTE'), 'anon cannot reach guarded reversal RPC');

insert into auth.users (id, email, raw_app_meta_data)
values ('91000000-0000-0000-0000-000000000001', 'roles@test.local', '{"role":"super_admin"}'::jsonb);

insert into public.projects (id, name)
values ('92000000-0000-0000-0000-000000000001', 'Role policy fixture');

insert into public.entries (id, entry_type, description, amount, project_id)
values ('93000000-0000-0000-0000-000000000001', 'expense', 'Role fixture entry', 10, '92000000-0000-0000-0000-000000000001');

insert into public.accounts (id, code, name_ar, account_type, normal_balance, level, is_postable)
values ('94000000-0000-0000-0000-000000000001', '999901', 'Role fixture account', 'asset', 'debit', 1, true);

insert into public.journals (id, journal_date, description, status, project_id)
values ('94500000-0000-0000-0000-000000000001', current_date, 'Role fixture journal', 'draft', '92000000-0000-0000-0000-000000000001');

insert into public.journal_lines (id, journal_id, line_number, account_id, project_id, description, debit, credit)
values ('94600000-0000-0000-0000-000000000001', '94500000-0000-0000-0000-000000000001', 1, '94000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'Role fixture line', 10, 0);

insert into public.cash_bank_accounts (id, ledger_account_id, name, account_kind)
values ('95000000-0000-0000-0000-000000000001', '94000000-0000-0000-0000-000000000001', 'Role fixture cash', 'cash');

insert into public.cash_bank_transactions (id, transaction_type, destination_account_id, amount, description)
values ('96000000-0000-0000-0000-000000000001', 'deposit', '95000000-0000-0000-0000-000000000001', 10, 'Role fixture movement');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"viewer"}}', true);

select is((select count(*) from public.entries where id='93000000-0000-0000-0000-000000000001'), 0::bigint, 'viewer cannot read entries');
select is((select count(*) from public.accounts where id='94000000-0000-0000-0000-000000000001'), 0::bigint, 'viewer cannot read accounts');
select is((select count(*) from public.journals where id='94500000-0000-0000-0000-000000000001'), 0::bigint, 'viewer cannot read journals');
select is((select count(*) from public.journal_lines where id='94600000-0000-0000-0000-000000000001'), 0::bigint, 'viewer cannot read journal lines');
select is((select count(*) from public.cash_bank_accounts where id='95000000-0000-0000-0000-000000000001'), 0::bigint, 'viewer cannot read cash accounts');
select is((select count(*) from public.cash_bank_transactions where id='96000000-0000-0000-0000-000000000001'), 0::bigint, 'viewer cannot read cash transactions');
select throws_ok(
  $$select public.post_single_line_entry('97000000-0000-0000-0000-000000000001',current_date,'92000000-0000-0000-0000-000000000001','expense','94000000-0000-0000-0000-000000000001','viewer denied','', '94000000-0000-0000-0000-000000000001',10)$$,
  '42501',
  'Insufficient permissions to post journal entries',
  'viewer cannot post entries'
);

select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"super_admin"}}', true);
select is((select count(*) from public.entries where id='93000000-0000-0000-0000-000000000001'), 1::bigint, 'super admin can read entries');
select is((select count(*) from public.accounts where id='94000000-0000-0000-0000-000000000001'), 1::bigint, 'super admin can read accounts');
select is((select count(*) from public.journals where id='94500000-0000-0000-0000-000000000001'), 1::bigint, 'super admin can read journals');
select is((select count(*) from public.journal_lines where id='94600000-0000-0000-0000-000000000001'), 1::bigint, 'super admin can read journal lines');
select is((select count(*) from public.cash_bank_accounts where id='95000000-0000-0000-0000-000000000001'), 1::bigint, 'super admin can read cash accounts');
select lives_ok($$insert into public.projects (id,name) values ('92000000-0000-0000-0000-000000000002','Super admin project')$$, 'super admin can create projects');
select lives_ok($$insert into public.accounts (id,code,name_ar,account_type,normal_balance,level,is_postable) values ('94000000-0000-0000-0000-000000000002','999902','Super admin account','asset','debit',1,true)$$, 'super admin can create accounts');

select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"accountant"}}', true);
select is(
  (with deleted as (
    delete from public.projects where id='92000000-0000-0000-0000-000000000001' returning id
  ) select count(*) from deleted),
  0::bigint,
  'accountant cannot delete projects'
);

reset role;
select * from finish();
rollback;

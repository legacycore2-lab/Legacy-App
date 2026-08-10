begin;

select plan(47);

-- 25 policies that must explicitly admit super_admin while preserving their
-- existing RLS scope.
select ok(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = v.schema_name
      and p.tablename = v.table_name
      and p.policyname = v.policy_name
      and position(
        'super_admin' in coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')
      ) > 0
  ),
  format('%s includes super_admin', v.policy_name)
)
from (values
  ('public', 'projects', 'projects_insert_finance'),
  ('public', 'projects', 'projects_update_finance'),
  ('public', 'projects', 'projects_delete_admin'),
  ('public', 'entries', 'entries_select_finance'),
  ('public', 'entries', 'entries_insert_finance'),
  ('public', 'entries', 'entries_update_finance'),
  ('public', 'entries', 'entries_delete_admin'),
  ('public', 'journals', 'journals_select_finance'),
  ('public', 'journals', 'journals_insert_finance'),
  ('public', 'journals', 'journals_update_finance'),
  ('public', 'journal_lines', 'journal_lines_select_finance'),
  ('public', 'journal_lines', 'journal_lines_insert_finance'),
  ('public', 'journal_lines', 'journal_lines_update_finance'),
  ('public', 'journal_lines', 'journal_lines_delete_finance'),
  ('public', 'accounts', 'accounts_insert_finance'),
  ('public', 'accounts', 'accounts_update_finance'),
  ('public', 'cash_bank_accounts', 'cash_bank_accounts_write_finance'),
  ('public', 'cash_bank_transactions', 'cash_bank_transactions_write_finance'),
  ('public', 'entry_attachments', 'entry_attachments_select_finance'),
  ('public', 'entry_attachments', 'entry_attachments_insert_finance'),
  ('public', 'entry_attachments', 'entry_attachments_delete_finance'),
  ('storage', 'objects', 'entry_attachments_objects_select_finance'),
  ('storage', 'objects', 'entry_attachments_objects_insert_finance'),
  ('storage', 'objects', 'entry_attachments_objects_update_finance'),
  ('storage', 'objects', 'entry_attachments_objects_delete_finance')
) as v(schema_name, table_name, policy_name);

-- 2 Cash & Banks SELECT policies must be finance-only.
-- Note: every policy qual contains the literal string 'viewer' as the coalesce()
-- fallback default, so a plain position() check would always find it.  Instead
-- we verify that 'viewer' does NOT appear inside the ARRAY[...] role list, which
-- is the only place it would indicate the role is permitted.
select ok(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = v.table_name
      and p.policyname = v.policy_name
      and position('super_admin' in coalesce(p.qual, '')) > 0
      and position('admin'       in coalesce(p.qual, '')) > 0
      and position('accountant'  in coalesce(p.qual, '')) > 0
      and not (coalesce(p.qual, '') ~ $$ARRAY\[.*'viewer'.*\]$$)
  ),
  format('%s is finance-only', v.policy_name)
)
from (values
  ('cash_bank_accounts', 'cash_bank_accounts_select_authenticated'),
  ('cash_bank_transactions', 'cash_bank_transactions_select_authenticated')
) as v(table_name, policy_name);

-- 9 financial RPCs: authenticated may execute, PUBLIC may not.
select ok(
  has_function_privilege('authenticated', v.signature, 'EXECUTE')
  and not exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where p.oid = v.signature::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  format('%s execute is authenticated-only', v.signature)
)
from (values
  ('public.post_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric)'),
  ('public.post_cash_bank_deposit(uuid,uuid,uuid,date,numeric,text,text)'),
  ('public.post_cash_bank_withdrawal(uuid,uuid,uuid,date,numeric,text,text)'),
  ('public.post_cash_bank_transfer(uuid,uuid,uuid,date,numeric,text,text)'),
  ('public.reverse_cash_bank_transaction(uuid,uuid,date,text)'),
  ('public.post_advance(uuid,text,text,uuid[],uuid,uuid,date,date,text,numeric)'),
  ('public.reverse_posted_journal(uuid,date,text)'),
  ('public.import_journal_entries_atomic(jsonb)'),
  ('public.reverse_journal_entry(uuid)')
) as v(signature);

-- 9 financial RPCs: the effective body contains the unified role guard.
select ok(
  position('super_admin' in pg_get_functiondef(v.signature::regprocedure)) > 0
  and position('accountant' in pg_get_functiondef(v.signature::regprocedure)) > 0,
  format('%s includes unified finance role guard', v.signature)
)
from (values
  ('public.post_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric)'),
  ('public.post_cash_bank_deposit(uuid,uuid,uuid,date,numeric,text,text)'),
  ('public.post_cash_bank_withdrawal(uuid,uuid,uuid,date,numeric,text,text)'),
  ('public.post_cash_bank_transfer(uuid,uuid,uuid,date,numeric,text,text)'),
  ('public.reverse_cash_bank_transaction(uuid,uuid,date,text)'),
  ('public.post_advance(uuid,text,text,uuid[],uuid,uuid,date,date,text,numeric)'),
  ('public.reverse_posted_journal(uuid,date,text)'),
  ('public.import_journal_entries_atomic(jsonb)'),
  ('public.reverse_journal_entry(uuid)')
) as v(signature);

-- Legacy overload remains for replay/history but is intentionally unreachable.
select ok(
  not has_function_privilege(
    'authenticated',
    'public.post_single_line_entry(date,text,text,text,text,text,text,numeric)',
    'EXECUTE'
  ),
  'legacy post_single_line_entry is not executable by authenticated'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where p.oid = 'public.post_single_line_entry(date,text,text,text,text,text,text,numeric)'::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  'legacy post_single_line_entry is not executable by PUBLIC'
);

select * from finish();

rollback;

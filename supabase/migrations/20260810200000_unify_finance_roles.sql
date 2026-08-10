-- Unify finance permissions across RLS policies and financial RPCs.
-- Forward-only migration. Existing migrations remain untouched.

begin;

-- ---------------------------------------------------------------------------
-- RLS: add super_admin to existing finance/admin policies without rewriting
-- their existing project/data scoping expressions.
-- ---------------------------------------------------------------------------
do $migration$
declare
  item record;
  current_qual text;
  current_check text;
  statement text;
  super_admin_predicate constant text :=
    $$coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') = 'super_admin'$$;
begin
  for item in
    select *
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
    ) as policies(schema_name, table_name, policy_name)
  loop
    select qual, with_check
      into current_qual, current_check
    from pg_policies
    where schemaname = item.schema_name
      and tablename = item.table_name
      and policyname = item.policy_name;

    if not found then
      raise exception 'Expected policy %.%.% was not found',
        item.schema_name, item.table_name, item.policy_name;
    end if;

    statement := format(
      'alter policy %I on %I.%I',
      item.policy_name,
      item.schema_name,
      item.table_name
    );

    if current_qual is not null then
      statement := statement || format(
        ' using ((%s) or (%s))',
        current_qual,
        super_admin_predicate
      );
    end if;

    if current_check is not null then
      statement := statement || format(
        ' with check ((%s) or (%s))',
        current_check,
        super_admin_predicate
      );
    end if;

    execute statement;
  end loop;
end
$migration$;

-- Cash & Banks reads were previously open to every authenticated role.
-- Restrict them to finance roles only.
alter policy cash_bank_accounts_select_authenticated
  on public.cash_bank_accounts
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer')
      in ('super_admin', 'admin', 'accountant')
  );

alter policy cash_bank_transactions_select_authenticated
  on public.cash_bank_transactions
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer')
      in ('super_admin', 'admin', 'accountant')
  );

-- ---------------------------------------------------------------------------
-- RPCs: preserve the effective function definitions exactly and modify only
-- the internal finance-role guard. Fail fast if the expected guard is absent.
-- ---------------------------------------------------------------------------
do $migration$
declare
  target regprocedure;
  function_definition text;
  updated_definition text;
  targets regprocedure[] := array[
    'public.post_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric)'::regprocedure,
    'public.post_cash_bank_deposit(uuid,uuid,uuid,date,numeric,text,text)'::regprocedure,
    'public.post_cash_bank_withdrawal(uuid,uuid,uuid,date,numeric,text,text)'::regprocedure,
    'public.post_cash_bank_transfer(uuid,uuid,uuid,date,numeric,text,text)'::regprocedure,
    'public.reverse_cash_bank_transaction(uuid,uuid,date,text)'::regprocedure,
    'public.post_advance(uuid,text,text,uuid[],uuid,uuid,date,date,text,numeric)'::regprocedure,
    'public.reverse_posted_journal(uuid,date,text)'::regprocedure,
    'public.import_journal_entries_atomic(jsonb)'::regprocedure,
    'public.reverse_journal_entry(uuid)'::regprocedure
  ];
begin
  foreach target in array targets loop
    select pg_get_functiondef(target::oid)
      into function_definition;

    updated_definition := regexp_replace(
      function_definition,
      $pattern$not[[:space:]]+in[[:space:]]*\([[:space:]]*'admin'[[:space:]]*,[[:space:]]*'accountant'[[:space:]]*\)$pattern$,
      $replacement$not in ('super_admin', 'admin', 'accountant')$replacement$,
      'gi'
    );

    if updated_definition = function_definition then
      raise exception 'Expected admin/accountant role guard was not found in %', target::text;
    end if;

    execute updated_definition;
    execute format('revoke all on function %s from public', target::text);
    execute format('grant execute on function %s to authenticated', target::text);
  end loop;
end
$migration$;

-- Legacy overload is intentionally retained for migration replay/history but
-- no authenticated caller should be able to execute it.
revoke execute on function public.post_single_line_entry(
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric
) from authenticated;
revoke execute on function public.post_single_line_entry(
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric
) from public;

commit;

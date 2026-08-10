-- Prepare previously reconciled RPCs for the existing Finance Roles V3 migration.
-- Restore only the two role guards to their pre-V3 contract so the canonical
-- 20260810200000_unify_finance_roles.sql migration can upgrade them itself.

begin;

do $migration$
declare
  target regprocedure;
  function_definition text;
  updated_definition text;
  targets regprocedure[] := array[
    'public.reverse_posted_journal(uuid,date,text)'::regprocedure,
    'public.import_journal_entries_atomic(jsonb)'::regprocedure
  ];
begin
  foreach target in array targets loop
    select pg_get_functiondef(target::oid)
      into function_definition;

    updated_definition := replace(
      function_definition,
      $$not in ('super_admin', 'admin', 'accountant')$$,
      $$not in ('admin', 'accountant')$$
    );

    if updated_definition = function_definition then
      raise exception 'Expected super_admin/admin/accountant guard was not found in %', target::text;
    end if;

    execute updated_definition;
  end loop;
end
$migration$;

commit;

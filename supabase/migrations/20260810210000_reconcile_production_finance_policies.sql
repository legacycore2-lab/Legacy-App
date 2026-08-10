-- Reconcile finance RLS policies that are recorded in migration history but
-- missing from the production schema. Forward-only; no data changes.
--
-- Keep this contract aligned with 20260722000000_harden_finance_rls.sql,
-- while including super_admin so the final state matches Finance Roles V3.

begin;

-- Accounts -----------------------------------------------------------------
drop policy if exists accounts_authenticated_insert on public.accounts;
drop policy if exists accounts_authenticated_update on public.accounts;
drop policy if exists accounts_insert_finance on public.accounts;
drop policy if exists accounts_update_finance on public.accounts;

create policy accounts_insert_finance
on public.accounts
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy accounts_update_finance
on public.accounts
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

-- Journals -----------------------------------------------------------------
drop policy if exists journals_authenticated_select on public.journals;
drop policy if exists journals_authenticated_insert on public.journals;
drop policy if exists journals_authenticated_update on public.journals;
drop policy if exists journals_select_finance on public.journals;
drop policy if exists journals_insert_finance on public.journals;
drop policy if exists journals_update_finance on public.journals;

create policy journals_select_finance
on public.journals
for select
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy journals_insert_finance
on public.journals
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy journals_update_finance
on public.journals
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

-- Journal lines ------------------------------------------------------------
drop policy if exists journal_lines_authenticated_select on public.journal_lines;
drop policy if exists journal_lines_authenticated_insert on public.journal_lines;
drop policy if exists journal_lines_authenticated_update on public.journal_lines;
drop policy if exists journal_lines_authenticated_delete on public.journal_lines;
drop policy if exists journal_lines_select_finance on public.journal_lines;
drop policy if exists journal_lines_insert_finance on public.journal_lines;
drop policy if exists journal_lines_update_finance on public.journal_lines;
drop policy if exists journal_lines_delete_finance on public.journal_lines;

create policy journal_lines_select_finance
on public.journal_lines
for select
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy journal_lines_insert_finance
on public.journal_lines
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy journal_lines_update_finance
on public.journal_lines
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy journal_lines_delete_finance
on public.journal_lines
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

commit;

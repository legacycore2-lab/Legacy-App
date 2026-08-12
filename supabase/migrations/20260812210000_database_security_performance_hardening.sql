-- Legacy Core ERP — production database security/performance hardening
-- Reconciles production RLS policies and foreign-key indexes after final production audit.

-- ---------------------------------------------------------------------------
-- Accounts: restrict direct DELETE and use initPlan-friendly auth helpers.
-- ---------------------------------------------------------------------------
drop policy if exists accounts_authenticated_delete on public.accounts;
drop policy if exists accounts_delete_admin on public.accounts;
create policy accounts_delete_admin
on public.accounts
for delete
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin')
);

alter policy accounts_authenticated_select on public.accounts
using ((select auth.uid()) is not null);

alter policy accounts_insert_finance on public.accounts
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy accounts_update_finance on public.accounts
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

-- ---------------------------------------------------------------------------
-- Cash & banks: replace ALL policies with one policy per operation so SELECT
-- has a single permissive policy and auth.jwt() is cached per statement.
-- ---------------------------------------------------------------------------
drop policy if exists cash_bank_accounts_write_finance on public.cash_bank_accounts;
drop policy if exists cash_bank_accounts_insert_finance on public.cash_bank_accounts;
drop policy if exists cash_bank_accounts_update_finance on public.cash_bank_accounts;
drop policy if exists cash_bank_accounts_delete_finance on public.cash_bank_accounts;

create policy cash_bank_accounts_insert_finance
on public.cash_bank_accounts
for insert
to authenticated
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy cash_bank_accounts_update_finance
on public.cash_bank_accounts
for update
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy cash_bank_accounts_delete_finance
on public.cash_bank_accounts
for delete
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy cash_bank_accounts_select_authenticated on public.cash_bank_accounts
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

drop policy if exists cash_bank_transactions_write_finance on public.cash_bank_transactions;
drop policy if exists cash_bank_transactions_insert_finance on public.cash_bank_transactions;
drop policy if exists cash_bank_transactions_update_finance on public.cash_bank_transactions;
drop policy if exists cash_bank_transactions_delete_finance on public.cash_bank_transactions;

create policy cash_bank_transactions_insert_finance
on public.cash_bank_transactions
for insert
to authenticated
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy cash_bank_transactions_update_finance
on public.cash_bank_transactions
for update
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

create policy cash_bank_transactions_delete_finance
on public.cash_bank_transactions
for delete
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy cash_bank_transactions_select_authenticated on public.cash_bank_transactions
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

-- ---------------------------------------------------------------------------
-- Journal entries and attachments: initPlan-friendly authorization checks.
-- ---------------------------------------------------------------------------
alter policy entries_select_finance on public.entries
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy entries_insert_finance on public.entries
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy entries_update_finance on public.entries
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy entries_delete_admin on public.entries
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin')
);

alter policy entry_attachments_select_finance on public.entry_attachments
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy entry_attachments_insert_finance on public.entry_attachments
with check (
  (
    coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
      in ('admin', 'accountant')
    and created_by = (select auth.uid())
  )
  or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer') = 'super_admin'
);

alter policy entry_attachments_delete_finance on public.entry_attachments
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

-- ---------------------------------------------------------------------------
-- Journals: remove broad authenticated DELETE access. Direct journal DELETE is
-- admin-only; privileged RPCs keep their own role checks and audit controls.
-- ---------------------------------------------------------------------------
drop policy if exists journals_authenticated_delete on public.journals;
drop policy if exists journals_force_delete on public.journals;
drop policy if exists journals_delete_admin on public.journals;

create policy journals_delete_admin
on public.journals
for delete
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin')
);

alter policy journals_select_finance on public.journals
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy journals_insert_finance on public.journals
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy journals_update_finance on public.journals
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy journal_force_delete_audit_select_admin on public.journal_force_delete_audit
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin')
);

-- ---------------------------------------------------------------------------
-- Projects and project access: optimize auth helpers and consolidate SELECT.
-- ---------------------------------------------------------------------------
alter policy projects_insert_finance on public.projects
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy projects_update_finance on public.projects
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin', 'accountant')
);

alter policy projects_delete_admin on public.projects
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin')
);

drop policy if exists user_project_access_admin_select on public.user_project_access;
drop policy if exists user_project_access_self_select on public.user_project_access;
drop policy if exists user_project_access_select on public.user_project_access;

create policy user_project_access_select
on public.user_project_access
for select
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin')
  or user_id = (select auth.uid())
);

drop policy if exists user_project_access_scope_admin_select on public.user_project_access_scope;
drop policy if exists user_project_access_scope_self_select on public.user_project_access_scope;
drop policy if exists user_project_access_scope_select on public.user_project_access_scope;

create policy user_project_access_scope_select
on public.user_project_access_scope
for select
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), 'viewer')
    in ('super_admin', 'admin')
  or user_id = (select auth.uid())
);

-- ---------------------------------------------------------------------------
-- Cover foreign-key columns reported by the Supabase Performance Advisor.
-- ---------------------------------------------------------------------------
create index if not exists accounts_created_by_idx on public.accounts(created_by);
create index if not exists advance_projects_project_id_idx on public.advance_projects(project_id);
create index if not exists advance_transactions_advance_id_idx on public.advance_transactions(advance_id);
create index if not exists advance_transactions_created_by_idx on public.advance_transactions(created_by);
create index if not exists advance_transactions_project_id_idx on public.advance_transactions(project_id);
create index if not exists advances_advance_ledger_account_id_idx on public.advances(advance_ledger_account_id);
create index if not exists advances_created_by_idx on public.advances(created_by);
create index if not exists advances_holder_user_id_idx on public.advances(holder_user_id);
create index if not exists advances_issue_transaction_id_idx on public.advances(issue_transaction_id);
create index if not exists cash_bank_accounts_created_by_idx on public.cash_bank_accounts(created_by);
create index if not exists cash_bank_transactions_created_by_idx on public.cash_bank_transactions(created_by);
create index if not exists entries_created_by_idx on public.entries(created_by);
create index if not exists entry_attachments_created_by_idx on public.entry_attachments(created_by);
create index if not exists journal_lines_created_by_idx on public.journal_lines(created_by);
create index if not exists journals_created_by_idx on public.journals(created_by);
create index if not exists journals_posted_by_idx on public.journals(posted_by);
create index if not exists journals_reversal_of_id_idx on public.journals(reversal_of_id);
create index if not exists journals_reversal_of_idx on public.journals(reversal_of);
create index if not exists journals_reversed_by_idx on public.journals(reversed_by);
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists system_settings_updated_by_idx on public.system_settings(updated_by);
create index if not exists system_settings_audit_actor_id_idx on public.system_settings_audit(actor_id);
create index if not exists user_admin_audit_actor_id_idx on public.user_admin_audit(actor_id);
create index if not exists user_project_access_granted_by_idx on public.user_project_access(granted_by);
create index if not exists user_project_access_project_id_idx on public.user_project_access(project_id);
create index if not exists user_project_access_scope_updated_by_idx on public.user_project_access_scope(updated_by);

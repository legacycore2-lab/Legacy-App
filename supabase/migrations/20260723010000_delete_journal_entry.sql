-- Legacy Core ERP
-- Allow admin role to delete journal entries and their journals.
-- journal_lines are removed automatically via ON DELETE CASCADE on journals.

alter table public.entries enable row level security;
alter table public.journals enable row level security;

drop policy if exists entries_delete_admin on public.entries;
drop policy if exists journals_delete_admin on public.journals;

create policy entries_delete_admin
  on public.entries
  for delete
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') = 'admin'
  );

create policy journals_delete_admin
  on public.journals
  for delete
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') = 'admin'
  );

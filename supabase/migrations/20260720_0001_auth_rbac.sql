-- Legacy Core authoritative access policy for the current Projects and Journal modules.
-- Applying this migration deliberately replaces existing policies on these two tables.

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('projects', 'entries')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  end loop;
end
$$;

alter table public.projects enable row level security;
alter table public.entries enable row level security;

revoke all on table public.projects from anon;
revoke all on table public.entries from anon;

grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.entries to authenticated;

create policy projects_select_authenticated
on public.projects
for select
to authenticated
using (auth.uid() is not null);

create policy projects_insert_finance
on public.projects
for insert
to authenticated
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy projects_update_finance
on public.projects
for update
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy projects_delete_admin
on public.projects
for delete
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') = 'admin');

create policy entries_select_finance
on public.entries
for select
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy entries_insert_finance
on public.entries
for insert
to authenticated
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy entries_update_finance
on public.entries
for update
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy entries_delete_admin
on public.entries
for delete
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') = 'admin');

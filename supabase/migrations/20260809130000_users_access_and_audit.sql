create table if not exists public.user_project_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null default auth.uid(),
  granted_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.user_project_access_scope (
  user_id uuid primary key references auth.users(id) on delete cascade,
  restricted boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('user_created', 'user_updated', 'status_changed', 'password_reset', 'projects_updated')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_project_access enable row level security;
alter table public.user_project_access_scope enable row level security;
alter table public.user_admin_audit enable row level security;

revoke all on public.user_project_access from anon;
revoke all on public.user_project_access_scope from anon;
revoke all on public.user_admin_audit from anon;
grant select on public.user_project_access to authenticated;
grant select on public.user_project_access_scope to authenticated;
grant select on public.user_admin_audit to authenticated;

drop policy if exists user_project_access_admin_select on public.user_project_access;
create policy user_project_access_admin_select on public.user_project_access for select to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'super_admin'));

drop policy if exists user_project_access_self_select on public.user_project_access;
create policy user_project_access_self_select on public.user_project_access for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists user_project_access_scope_admin_select on public.user_project_access_scope;
create policy user_project_access_scope_admin_select on public.user_project_access_scope for select to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'super_admin'));

drop policy if exists user_project_access_scope_self_select on public.user_project_access_scope;
create policy user_project_access_scope_self_select on public.user_project_access_scope for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists user_admin_audit_admin_select on public.user_admin_audit;
create policy user_admin_audit_admin_select on public.user_admin_audit for select to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'super_admin'));

drop policy if exists projects_select_authenticated on public.projects;
drop policy if exists projects_select_by_assignment on public.projects;
create policy projects_select_by_assignment on public.projects for select to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'super_admin')
  or not exists (
    select 1 from public.user_project_access_scope
    where user_project_access_scope.user_id = (select auth.uid())
      and user_project_access_scope.restricted
  )
  or exists (
    select 1 from public.user_project_access
    where user_project_access.user_id = (select auth.uid())
      and user_project_access.project_id = projects.id
  )
);

create index if not exists user_project_access_user_idx on public.user_project_access(user_id);
create index if not exists user_admin_audit_target_idx on public.user_admin_audit(target_user_id, created_at desc);

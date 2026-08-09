create sequence if not exists public.advances_number_seq as bigint start with 1;

create table if not exists public.advances (
  id uuid primary key default gen_random_uuid(),
  advance_number bigint not null default nextval('public.advances_number_seq'::regclass),
  holder_user_id uuid references auth.users(id) on delete set null,
  holder_name text not null,
  holder_title text,
  issue_date date not null default current_date,
  due_date date,
  purpose text not null,
  amount numeric(18, 2) not null check (amount > 0),
  spent_amount numeric(18, 2) not null default 0 check (spent_amount >= 0),
  returned_amount numeric(18, 2) not null default 0 check (returned_amount >= 0),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint advances_number_unique unique (advance_number),
  constraint advances_due_after_issue check (due_date is null or due_date >= issue_date),
  constraint advances_balance_check check (spent_amount + returned_amount <= amount)
);

alter sequence public.advances_number_seq owned by public.advances.advance_number;

create table if not exists public.advance_projects (
  advance_id uuid not null references public.advances(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (advance_id, project_id)
);

alter table public.advances enable row level security;
alter table public.advance_projects enable row level security;
revoke all on table public.advances, public.advance_projects from anon;
grant select, insert, update on table public.advances, public.advance_projects to authenticated;
grant usage, select on sequence public.advances_number_seq to authenticated;

create policy advances_select_finance on public.advances for select to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'));
create policy advances_insert_finance on public.advances for insert to authenticated
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'));
create policy advances_update_finance on public.advances for update to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'))
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'));

create policy advance_projects_select_finance on public.advance_projects for select to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'));
create policy advance_projects_insert_finance on public.advance_projects for insert to authenticated
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'));
create policy advance_projects_update_finance on public.advance_projects for update to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'))
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('super_admin', 'admin', 'accountant'));

create or replace view public.advances_overview
with (security_invoker = true)
as
select
  a.id, a.advance_number, a.holder_name, a.holder_title, a.issue_date, a.due_date,
  a.purpose, a.amount, a.spent_amount, a.returned_amount,
  coalesce(array_agg(p.name order by p.name) filter (where p.id is not null), array[]::text[]) as project_names
from public.advances a
left join public.advance_projects ap on ap.advance_id = a.id
left join public.projects p on p.id = ap.project_id
group by a.id;

revoke all on public.advances_overview from anon;
grant select on public.advances_overview to authenticated;

comment on table public.advance_projects is 'Many-to-many project assignments for each employee advance.';
comment on view public.advances_overview is 'Read model for advances with every linked project.';

-- Legacy Core ERP
-- Expand projects for production-ready project creation.
--
-- start_date and close_date remain untouched because the legacy database may
-- contain text-formatted dates. The application validates new ISO dates while
-- a dedicated, data-audited migration can normalize legacy dates later.

begin;

alter table public.projects
  add column if not exists code text,
  add column if not exists client_name text,
  add column if not exists location text,
  add column if not exists manager text,
  add column if not exists status text not null default 'active',
  add column if not exists contract_value numeric(18, 2) not null default 0,
  add column if not exists received numeric(18, 2) not null default 0,
  add column if not exists spent numeric(18, 2) not null default 0,
  add column if not exists progress numeric(5, 2) not null default 0,
  add column if not exists end_date text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists is_archived boolean not null default false;

-- Legacy deployments may already have a narrower status constraint. Remove it
-- before normalizing rows so valid target values are not rejected mid-migration.
alter table public.projects
  drop constraint if exists projects_status_check;

update public.projects
set status = case
  when status = 'open' then 'active'
  when status = 'closed' then 'completed'
  when status is null or btrim(status) = '' then 'active'
  else status
end;

-- Fail safely if unexpected legacy values still exist instead of silently
-- coercing or deleting data.
do $$
begin
  if exists (
    select 1
    from public.projects
    where status not in ('active', 'paused', 'completed', 'archived')
  ) then
    raise exception 'Unexpected project status values exist. Normalize them before applying projects_status_check.';
  end if;
end
$$;

alter table public.projects
  add constraint projects_status_check
    check (status in ('active', 'paused', 'completed', 'archived')),
  drop constraint if exists projects_contract_value_check,
  add constraint projects_contract_value_check check (contract_value >= 0),
  drop constraint if exists projects_received_check,
  add constraint projects_received_check check (received >= 0),
  drop constraint if exists projects_spent_check,
  add constraint projects_spent_check check (spent >= 0),
  drop constraint if exists projects_progress_check,
  add constraint projects_progress_check check (progress between 0 and 100);

create unique index if not exists projects_code_unique_idx
  on public.projects (lower(code))
  where code is not null and btrim(code) <> '';

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_archived_idx on public.projects (is_archived);

create or replace function public.set_projects_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_projects_updated_at();

commit;

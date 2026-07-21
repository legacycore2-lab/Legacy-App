-- Legacy Core ERP
-- Expand projects for production-ready project creation.

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
  add column if not exists end_date date,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid default auth.uid();

alter table public.projects
  drop constraint if exists projects_status_check,
  add constraint projects_status_check
    check (status in ('active', 'paused', 'completed', 'archived')),
  drop constraint if exists projects_contract_value_check,
  add constraint projects_contract_value_check check (contract_value >= 0),
  drop constraint if exists projects_received_check,
  add constraint projects_received_check check (received >= 0),
  drop constraint if exists projects_spent_check,
  add constraint projects_spent_check check (spent >= 0),
  drop constraint if exists projects_progress_check,
  add constraint projects_progress_check check (progress between 0 and 100),
  drop constraint if exists projects_dates_check,
  add constraint projects_dates_check check (end_date is null or start_date is null or end_date >= start_date);

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

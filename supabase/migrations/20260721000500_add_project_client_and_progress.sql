alter table public.projects
  add column if not exists client_name text,
  add column if not exists progress smallint not null default 0;

alter table public.projects
  drop constraint if exists projects_progress_range;

alter table public.projects
  add constraint projects_progress_range
  check (progress between 0 and 100);

comment on column public.projects.client_name is 'Client display name for the project.';
comment on column public.projects.progress is 'Actual project completion percentage from 0 to 100.';

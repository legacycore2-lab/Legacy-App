-- Test-only snapshot of the legacy schema that predates versioned migrations.
-- Production data is never loaded or modified by this fixture.

create sequence if not exists public.entries_number_seq as bigint start with 1;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date text,
  close_date text,
  is_archived boolean not null default false
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  entry_number bigint not null default nextval('public.entries_number_seq'::regclass),
  entry_code text,
  entry_date date not null default current_date,
  entry_type text not null,
  category text,
  description text,
  contractor_name text,
  payment_method text,
  amount numeric(18, 2) not null default 0,
  project_id uuid references public.projects(id) on delete restrict,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint entries_number_unique unique (entry_number),
  constraint entries_type_check check (entry_type in ('income', 'expense')),
  constraint entries_amount_check check (amount >= 0)
);

alter sequence public.entries_number_seq owned by public.entries.entry_number;

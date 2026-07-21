-- Legacy Core ERP
-- Journal Engine Foundation
--
-- IMPORTANT:
-- 1. This migration is not executed automatically by this pull request.
-- 2. Review it in GitHub before running it in Supabase.
-- 3. It only adds new accounting objects and does not modify existing
--    projects, entries, or entry_attachments data.

begin;

-- ---------------------------------------------------------------------------
-- Sequences
-- ---------------------------------------------------------------------------

create sequence if not exists public.journals_number_seq
  as bigint
  start with 1
  increment by 1
  no minvalue
  no maxvalue
  cache 1;

-- ---------------------------------------------------------------------------
-- Chart of accounts
-- ---------------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name_ar text not null,
  name_en text,
  account_type text not null,
  normal_balance text not null,
  parent_id uuid references public.accounts(id) on delete restrict,
  level smallint not null default 1,
  is_postable boolean not null default true,
  is_active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint accounts_code_unique unique (code),
  constraint accounts_code_not_blank check (btrim(code) <> ''),
  constraint accounts_name_ar_not_blank check (btrim(name_ar) <> ''),
  constraint accounts_type_check check (
    account_type = any (array[
      'asset'::text,
      'liability'::text,
      'equity'::text,
      'revenue'::text,
      'expense'::text
    ])
  ),
  constraint accounts_normal_balance_check check (
    normal_balance = any (array['debit'::text, 'credit'::text])
  ),
  constraint accounts_level_check check (level between 1 and 10),
  constraint accounts_parent_not_self check (parent_id is null or parent_id <> id),
  constraint accounts_type_normal_balance_check check (
    (account_type in ('asset', 'expense') and normal_balance = 'debit')
    or
    (account_type in ('liability', 'equity', 'revenue') and normal_balance = 'credit')
  )
);

create index if not exists accounts_parent_id_idx
  on public.accounts(parent_id);

create index if not exists accounts_type_idx
  on public.accounts(account_type);

create index if not exists accounts_active_idx
  on public.accounts(is_active)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- Journal headers
-- ---------------------------------------------------------------------------

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  journal_number bigint not null default nextval('public.journals_number_seq'::regclass),
  journal_code text,
  journal_date date not null default current_date,
  description text not null,
  status text not null default 'draft',
  project_id uuid references public.projects(id) on delete restrict,
  source_type text,
  source_id uuid,
  reversal_of_id uuid references public.journals(id) on delete restrict,
  posted_at timestamptz,
  posted_by uuid references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint journals_number_unique unique (journal_number),
  constraint journals_code_unique unique (journal_code),
  constraint journals_description_not_blank check (btrim(description) <> ''),
  constraint journals_status_check check (
    status = any (array['draft'::text, 'posted'::text, 'reversed'::text])
  ),
  constraint journals_posting_metadata_check check (
    (status = 'draft' and posted_at is null and posted_by is null)
    or
    (status in ('posted', 'reversed') and posted_at is not null)
  ),
  constraint journals_reversal_not_self check (reversal_of_id is null or reversal_of_id <> id)
);

alter sequence public.journals_number_seq owned by public.journals.journal_number;

create index if not exists journals_date_idx
  on public.journals(journal_date desc);

create index if not exists journals_status_idx
  on public.journals(status);

create index if not exists journals_project_id_idx
  on public.journals(project_id);

create index if not exists journals_source_idx
  on public.journals(source_type, source_id);

create index if not exists journals_created_at_idx
  on public.journals(created_at desc);

-- ---------------------------------------------------------------------------
-- Journal lines
-- ---------------------------------------------------------------------------

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals(id) on delete cascade,
  line_number smallint not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  project_id uuid references public.projects(id) on delete restrict,
  description text,
  debit numeric(18, 2) not null default 0,
  credit numeric(18, 2) not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint journal_lines_number_unique unique (journal_id, line_number),
  constraint journal_lines_line_number_check check (line_number > 0),
  constraint journal_lines_debit_check check (debit >= 0),
  constraint journal_lines_credit_check check (credit >= 0),
  constraint journal_lines_one_side_check check (
    (debit > 0 and credit = 0)
    or
    (credit > 0 and debit = 0)
  )
);

create index if not exists journal_lines_journal_id_idx
  on public.journal_lines(journal_id);

create index if not exists journal_lines_account_id_idx
  on public.journal_lines(account_id);

create index if not exists journal_lines_project_id_idx
  on public.journal_lines(project_id);

-- ---------------------------------------------------------------------------
-- Shared timestamp trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_accounting_updated_at()
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

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_accounting_updated_at();

drop trigger if exists journals_set_updated_at on public.journals;
create trigger journals_set_updated_at
before update on public.journals
for each row execute function public.set_accounting_updated_at();

drop trigger if exists journal_lines_set_updated_at on public.journal_lines;
create trigger journal_lines_set_updated_at
before update on public.journal_lines
for each row execute function public.set_accounting_updated_at();

-- ---------------------------------------------------------------------------
-- Posting and immutability rules
-- ---------------------------------------------------------------------------

create or replace function public.validate_journal_before_posting()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  total_debit numeric(18, 2);
  total_credit numeric(18, 2);
  lines_count integer;
begin
  if old.status = 'draft' and new.status = 'posted' then
    select
      count(*),
      coalesce(sum(debit), 0),
      coalesce(sum(credit), 0)
    into lines_count, total_debit, total_credit
    from public.journal_lines
    where journal_id = new.id;

    if lines_count < 2 then
      raise exception 'A journal must contain at least two lines before posting';
    end if;

    if total_debit <= 0 or total_credit <= 0 then
      raise exception 'A journal must contain positive debit and credit totals';
    end if;

    if total_debit <> total_credit then
      raise exception 'Journal is not balanced: debit %, credit %', total_debit, total_credit;
    end if;

    if exists (
      select 1
      from public.journal_lines jl
      join public.accounts a on a.id = jl.account_id
      where jl.journal_id = new.id
        and (a.is_active = false or a.is_postable = false)
    ) then
      raise exception 'Journal contains an inactive or non-postable account';
    end if;

    new.posted_at = coalesce(new.posted_at, now());
    new.posted_by = coalesce(new.posted_by, auth.uid());
  end if;

  if old.status in ('posted', 'reversed') and new.status <> old.status then
    raise exception 'Posted or reversed journals cannot change status directly';
  end if;

  return new;
end;
$$;

drop trigger if exists journals_validate_before_posting on public.journals;
create trigger journals_validate_before_posting
before update of status on public.journals
for each row execute function public.validate_journal_before_posting();

create or replace function public.protect_posted_journal_lines()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_journal_id uuid;
  target_status text;
begin
  target_journal_id = coalesce(new.journal_id, old.journal_id);

  select status
  into target_status
  from public.journals
  where id = target_journal_id;

  if target_status in ('posted', 'reversed') then
    raise exception 'Lines of posted or reversed journals are immutable';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists journal_lines_protect_posted on public.journal_lines;
create trigger journal_lines_protect_posted
before insert or update or delete on public.journal_lines
for each row execute function public.protect_posted_journal_lines();

create or replace function public.protect_posted_journal_header()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.status in ('posted', 'reversed') then
    if new.journal_number is distinct from old.journal_number
      or new.journal_code is distinct from old.journal_code
      or new.journal_date is distinct from old.journal_date
      or new.description is distinct from old.description
      or new.project_id is distinct from old.project_id
      or new.source_type is distinct from old.source_type
      or new.source_id is distinct from old.source_id
      or new.reversal_of_id is distinct from old.reversal_of_id then
      raise exception 'Posted or reversed journal headers are immutable';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists journals_protect_posted_header on public.journals;
create trigger journals_protect_posted_header
before update on public.journals
for each row execute function public.protect_posted_journal_header();

-- ---------------------------------------------------------------------------
-- Reporting view
-- ---------------------------------------------------------------------------

create or replace view public.general_ledger_view
with (security_invoker = true)
as
select
  j.id as journal_id,
  j.journal_number,
  j.journal_code,
  j.journal_date,
  j.description as journal_description,
  j.status,
  jl.id as journal_line_id,
  jl.line_number,
  jl.description as line_description,
  jl.debit,
  jl.credit,
  a.id as account_id,
  a.code as account_code,
  a.name_ar as account_name_ar,
  a.name_en as account_name_en,
  a.account_type,
  coalesce(jl.project_id, j.project_id) as project_id,
  j.created_at,
  j.posted_at
from public.journals j
join public.journal_lines jl on jl.journal_id = j.id
join public.accounts a on a.id = jl.account_id
where j.status in ('posted', 'reversed');

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Foundation policy: authenticated users only.
-- Role-specific permissions can be tightened after the application role model
-- is audited and approved.
-- ---------------------------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.journals enable row level security;
alter table public.journal_lines enable row level security;

create policy accounts_authenticated_select
on public.accounts
for select
to authenticated
using (true);

create policy accounts_authenticated_insert
on public.accounts
for insert
to authenticated
with check (auth.uid() is not null);

create policy accounts_authenticated_update
on public.accounts
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy journals_authenticated_select
on public.journals
for select
to authenticated
using (true);

create policy journals_authenticated_insert
on public.journals
for insert
to authenticated
with check (auth.uid() is not null);

create policy journals_authenticated_update
on public.journals
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy journal_lines_authenticated_select
on public.journal_lines
for select
to authenticated
using (true);

create policy journal_lines_authenticated_insert
on public.journal_lines
for insert
to authenticated
with check (auth.uid() is not null);

create policy journal_lines_authenticated_update
on public.journal_lines
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy journal_lines_authenticated_delete
on public.journal_lines
for delete
to authenticated
using (auth.uid() is not null);

commit;

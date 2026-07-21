-- Legacy Core ERP
-- Journal Engine hardening
--
-- This migration closes invalid status-transition paths and provides an
-- atomic, auditable reversal operation for posted journals.

begin;

-- ---------------------------------------------------------------------------
-- Status transitions and posting validation
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
  if old.status = new.status then
    return new;
  end if;

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
    return new;
  end if;

  if old.status = 'posted' and new.status = 'reversed' then
    if not exists (
      select 1
      from public.journals reversal
      where reversal.reversal_of_id = old.id
        and reversal.status = 'posted'
    ) then
      raise exception 'A posted journal can only be marked reversed after a posted reversal journal exists';
    end if;

    new.posted_at = old.posted_at;
    new.posted_by = old.posted_by;
    return new;
  end if;

  raise exception 'Invalid journal status transition: % -> %', old.status, new.status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic journal reversal
-- ---------------------------------------------------------------------------

create or replace function public.reverse_posted_journal(
  target_journal_id uuid,
  reversal_date date default current_date,
  reversal_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  original public.journals%rowtype;
  reversal_id uuid;
begin
  select *
  into original
  from public.journals
  where id = target_journal_id
  for update;

  if not found then
    raise exception 'Journal not found';
  end if;

  if original.status <> 'posted' then
    raise exception 'Only posted journals can be reversed';
  end if;

  if exists (
    select 1
    from public.journals
    where reversal_of_id = original.id
      and status in ('posted', 'reversed')
  ) then
    raise exception 'Journal has already been reversed';
  end if;

  insert into public.journals (
    journal_date,
    description,
    status,
    project_id,
    source_type,
    source_id,
    reversal_of_id,
    created_by
  )
  values (
    reversal_date,
    coalesce(nullif(btrim(reversal_description), ''), 'Reversal of journal ' || original.journal_number),
    'draft',
    original.project_id,
    'journal_reversal',
    original.id,
    original.id,
    auth.uid()
  )
  returning id into reversal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    project_id,
    description,
    debit,
    credit,
    created_by
  )
  select
    reversal_id,
    line_number,
    account_id,
    project_id,
    coalesce(description, 'Reversal'),
    credit,
    debit,
    auth.uid()
  from public.journal_lines
  where journal_id = original.id
  order by line_number;

  update public.journals
  set status = 'posted'
  where id = reversal_id;

  update public.journals
  set status = 'reversed'
  where id = original.id;

  return reversal_id;
end;
$$;

revoke all on function public.reverse_posted_journal(uuid, date, text) from public;
grant execute on function public.reverse_posted_journal(uuid, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Idempotent RLS policy definitions
-- ---------------------------------------------------------------------------

drop policy if exists accounts_authenticated_select on public.accounts;
drop policy if exists accounts_authenticated_insert on public.accounts;
drop policy if exists accounts_authenticated_update on public.accounts;
drop policy if exists journals_authenticated_select on public.journals;
drop policy if exists journals_authenticated_insert on public.journals;
drop policy if exists journals_authenticated_update on public.journals;
drop policy if exists journal_lines_authenticated_select on public.journal_lines;
drop policy if exists journal_lines_authenticated_insert on public.journal_lines;
drop policy if exists journal_lines_authenticated_update on public.journal_lines;
drop policy if exists journal_lines_authenticated_delete on public.journal_lines;

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

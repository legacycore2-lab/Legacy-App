-- Enforce finance RBAC at the database boundary.
-- Roles are trusted only from app_metadata, which cannot be changed by end users.

drop policy if exists accounts_authenticated_select on public.accounts;
drop policy if exists accounts_authenticated_insert on public.accounts;
drop policy if exists accounts_authenticated_update on public.accounts;
drop policy if exists accounts_select_authenticated on public.accounts;
drop policy if exists accounts_insert_finance on public.accounts;
drop policy if exists accounts_update_finance on public.accounts;

create policy accounts_select_authenticated
on public.accounts
for select
to authenticated
using ((select auth.uid()) is not null);

create policy accounts_insert_finance
on public.accounts
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy accounts_update_finance
on public.accounts
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

drop policy if exists journals_authenticated_select on public.journals;
drop policy if exists journals_authenticated_insert on public.journals;
drop policy if exists journals_authenticated_update on public.journals;
drop policy if exists journals_select_finance on public.journals;
drop policy if exists journals_insert_finance on public.journals;
drop policy if exists journals_update_finance on public.journals;

create policy journals_select_finance
on public.journals
for select
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy journals_insert_finance
on public.journals
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy journals_update_finance
on public.journals
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

drop policy if exists journal_lines_authenticated_select on public.journal_lines;
drop policy if exists journal_lines_authenticated_insert on public.journal_lines;
drop policy if exists journal_lines_authenticated_update on public.journal_lines;
drop policy if exists journal_lines_authenticated_delete on public.journal_lines;
drop policy if exists journal_lines_select_finance on public.journal_lines;
drop policy if exists journal_lines_insert_finance on public.journal_lines;
drop policy if exists journal_lines_update_finance on public.journal_lines;
drop policy if exists journal_lines_delete_finance on public.journal_lines;

create policy journal_lines_select_finance
on public.journal_lines
for select
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy journal_lines_insert_finance
on public.journal_lines
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy journal_lines_update_finance
on public.journal_lines
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy journal_lines_delete_finance
on public.journal_lines
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

-- RPC grants cannot express role conditions, so keep the authenticated grant
-- and enforce the finance role inside the security-invoker function.
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
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to reverse journals'
      using errcode = '42501';
  end if;

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
    journal_date, description, status, project_id, source_type,
    source_id, reversal_of_id, created_by
  )
  values (
    reversal_date,
    coalesce(nullif(btrim(reversal_description), ''), 'Reversal of journal ' || original.journal_number),
    'draft', original.project_id, 'journal_reversal', original.id, original.id, (select auth.uid())
  )
  returning id into reversal_id;

  insert into public.journal_lines (
    journal_id, line_number, account_id, project_id,
    description, debit, credit, created_by
  )
  select reversal_id, line_number, account_id, project_id,
    coalesce(description, 'Reversal'), credit, debit, (select auth.uid())
  from public.journal_lines
  where journal_id = original.id
  order by line_number;

  update public.journals set status = 'posted' where id = reversal_id;
  update public.journals set status = 'reversed' where id = original.id;

  return reversal_id;
end;
$$;

revoke all on function public.reverse_posted_journal(uuid, date, text) from public;
grant execute on function public.reverse_posted_journal(uuid, date, text) to authenticated;


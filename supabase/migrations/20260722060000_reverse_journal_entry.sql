-- Legacy Core ERP
-- Add auditable journal reversal support without double-counting dashboard totals.

alter table public.journals
  add column if not exists reversed_by uuid references public.journals(id),
  add column if not exists reversal_of uuid references public.journals(id);

alter table public.entries
  add column if not exists is_reversal boolean not null default false,
  add column if not exists reversal_of_entry_id uuid references public.entries(id);

create unique index if not exists entries_one_reversal_per_source_idx
  on public.entries (reversal_of_entry_id)
  where reversal_of_entry_id is not null;

create or replace function public.reverse_journal_entry(
  p_source_entry_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_journal      record;
  v_reversal_id  uuid;
  v_new_entry_id uuid;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to reverse journal entries'
      using errcode = '42501';
  end if;

  select
    j.id            as journal_id,
    j.status        as journal_status,
    j.project_id    as journal_project_id,
    j.description   as journal_description,
    e.entry_type,
    e.category,
    e.description   as entry_description,
    e.contractor_name,
    e.payment_method,
    e.amount,
    e.project_id    as entry_project_id,
    e.is_reversal
  into v_journal
  from public.journals j
  join public.entries e on e.id = j.source_id
  where j.source_id   = p_source_entry_id
    and j.source_type = 'single_line_entry'
  for update of j, e;

  if not found then
    raise exception 'Entry not found'
      using errcode = '23503';
  end if;

  if v_journal.is_reversal then
    raise exception 'Reversal entries cannot be reversed'
      using errcode = '23514';
  end if;

  if v_journal.journal_status = 'reversed' then
    raise exception 'Entry is already reversed'
      using errcode = '23514';
  end if;

  if v_journal.journal_status != 'posted' then
    raise exception 'Only posted entries can be reversed'
      using errcode = '23514';
  end if;

  insert into public.entries (
    entry_date, entry_type, category, description,
    contractor_name, payment_method, amount, project_id,
    created_by, is_reversal, reversal_of_entry_id
  )
  values (
    current_date,
    v_journal.entry_type,
    v_journal.category,
    'عكس: ' || coalesce(v_journal.entry_description, ''),
    v_journal.contractor_name,
    v_journal.payment_method,
    v_journal.amount,
    v_journal.entry_project_id,
    auth.uid(),
    true,
    p_source_entry_id
  )
  returning id into v_new_entry_id;

  insert into public.journals (
    journal_date, description, status, project_id,
    source_type, source_id, created_by, reversal_of
  )
  values (
    current_date,
    'عكس: ' || coalesce(v_journal.journal_description, ''),
    'posted',
    v_journal.journal_project_id,
    'single_line_entry',
    v_new_entry_id,
    auth.uid(),
    v_journal.journal_id
  )
  returning id into v_reversal_id;

  insert into public.journal_lines (
    journal_id, line_number, account_id, project_id,
    description, debit, credit, created_by
  )
  select
    v_reversal_id, line_number, account_id, project_id,
    'عكس: ' || coalesce(description, ''),
    credit, debit, auth.uid()
  from public.journal_lines
  where journal_id = v_journal.journal_id;

  update public.journals
  set status      = 'reversed',
      reversed_by = v_reversal_id
  where id = v_journal.journal_id;

  return v_new_entry_id;
end;
$$;

revoke all   on function public.reverse_journal_entry(uuid) from public;
grant execute on function public.reverse_journal_entry(uuid) to authenticated;

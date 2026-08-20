-- Legacy Core ERP
-- Fix single-line journal reversal to use the canonical reversal_of_id column.
--
-- Root cause:
-- reverse_journal_entry wrote the reversal link into the legacy reversal_of
-- column, while validate_journal_status_transition checks reversal_of_id before
-- allowing the original posted journal to become reversed. The reversal journal
-- was therefore posted successfully but the final status transition failed and
-- the transaction rolled back.

begin;

create or replace function public.reverse_journal_entry(p_source_entry_id uuid)
returns uuid
language plpgsql
set search_path to 'public'
as $function$
declare
  v_journal      record;
  v_reversal_id  uuid;
  v_new_entry_id uuid;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') not in ('super_admin', 'admin', 'accountant') then
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

  if v_journal.journal_status <> 'posted' then
    raise exception 'Only posted entries can be reversed'
      using errcode = '23514';
  end if;

  insert into public.entries (
    entry_date,
    entry_type,
    category,
    description,
    contractor_name,
    payment_method,
    amount,
    project_id,
    created_by,
    is_reversal,
    reversal_of_entry_id
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
    journal_date,
    description,
    status,
    project_id,
    source_type,
    source_id,
    created_by,
    reversal_of_id
  )
  values (
    current_date,
    'عكس: ' || coalesce(v_journal.journal_description, ''),
    'draft',
    v_journal.journal_project_id,
    'single_line_entry',
    v_new_entry_id,
    auth.uid(),
    v_journal.journal_id
  )
  returning id into v_reversal_id;

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
    v_reversal_id,
    line_number,
    account_id,
    project_id,
    'عكس: ' || coalesce(description, ''),
    credit,
    debit,
    auth.uid()
  from public.journal_lines
  where journal_id = v_journal.journal_id;

  update public.journals
  set status = 'posted',
      posted_at = now()
  where id = v_reversal_id;

  update public.journals
  set status = 'reversed',
      reversed_by = v_reversal_id
  where id = v_journal.journal_id;

  return v_new_entry_id;
end;
$function$;

commit;

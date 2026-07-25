-- Legacy Core ERP
-- Add delete and update operations for single-line journal entries.
-- delete_single_line_entry: removes the entry and its linked journal in one transaction.
-- update_single_line_entry: rewrites the entry and rebuilds the journal lines in place.

-- ---------------------------------------------------------------------------
-- DELETE
-- ---------------------------------------------------------------------------

create or replace function public.delete_single_line_entry(
  p_entry_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_journal_id uuid;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to delete journal entries'
      using errcode = '42501';
  end if;

  -- Find the linked journal (if any)
  select id
  into v_journal_id
  from public.journals
  where source_type = 'single_line_entry'
    and source_id = p_entry_id;

  if v_journal_id is not null then
    -- Temporarily demote journal to draft so the immutability trigger allows deletion
    update public.journals
    set status = 'draft',
        posted_at = null,
        posted_by = null
    where id = v_journal_id;

    -- journal_lines cascade-delete with the journal
    delete from public.journals where id = v_journal_id;
  end if;

  delete from public.entries where id = p_entry_id;
end;
$$;

revoke all on function public.delete_single_line_entry(uuid) from public;
grant execute on function public.delete_single_line_entry(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- UPDATE
-- ---------------------------------------------------------------------------

create or replace function public.update_single_line_entry(
  p_entry_id        uuid,
  p_entry_date      date,
  p_project_id      uuid,
  p_entry_type      text,
  p_category_account_id uuid,
  p_description     text,
  p_contractor_name text,
  p_payment_account_id  uuid,
  p_amount          numeric
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_journal_id          uuid;
  v_normalized_amount   numeric(18, 2);
  v_category_label      text;
  v_payment_label       text;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to update journal entries'
      using errcode = '42501';
  end if;

  -- Validate inputs
  if p_entry_date is null or p_project_id is null or btrim(p_description) = '' then
    raise exception 'Date, project, and description are required'
      using errcode = '22023';
  end if;

  if p_entry_type not in ('income', 'expense') then
    raise exception 'Entry type must be income or expense'
      using errcode = '22023';
  end if;

  v_normalized_amount := round(p_amount, 2);
  if v_normalized_amount is null or v_normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero'
      using errcode = '22023';
  end if;

  if p_payment_account_id = p_category_account_id then
    raise exception 'Journal sides must use different accounts'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and not is_archived
  ) then
    raise exception 'Project not found or archived'
      using errcode = '23503';
  end if;

  select code || ' - ' || name_ar
  into v_category_label
  from public.accounts
  where id = p_category_account_id
    and is_active
    and is_postable
    and account_type = case when p_entry_type = 'expense' then 'expense' else 'revenue' end;

  if v_category_label is null then
    raise exception 'Category account not found, inactive, or incompatible'
      using errcode = '23503';
  end if;

  select code || ' - ' || name_ar
  into v_payment_label
  from public.accounts
  where id = p_payment_account_id
    and is_active
    and is_postable
    and account_type = 'asset';

  if v_payment_label is null then
    raise exception 'Payment account not found, inactive, or incompatible'
      using errcode = '23503';
  end if;

  -- Update the entry row
  update public.entries
  set
    entry_date      = p_entry_date,
    entry_type      = p_entry_type,
    category        = v_category_label,
    description     = btrim(p_description),
    contractor_name = nullif(btrim(p_contractor_name), ''),
    payment_method  = v_payment_label,
    amount          = v_normalized_amount,
    project_id      = p_project_id
  where id = p_entry_id;

  if not found then
    raise exception 'Entry not found'
      using errcode = '23503';
  end if;

  -- Find the linked journal
  select id
  into v_journal_id
  from public.journals
  where source_type = 'single_line_entry'
    and source_id = p_entry_id;

  if v_journal_id is not null then
    -- Demote to draft so immutability triggers allow changes
    update public.journals
    set status     = 'draft',
        posted_at  = null,
        posted_by  = null
    where id = v_journal_id;

    -- Update journal header
    update public.journals
    set
      journal_date = p_entry_date,
      description  = btrim(p_description),
      project_id   = p_project_id
    where id = v_journal_id;

    -- Rebuild the two lines
    delete from public.journal_lines where journal_id = v_journal_id;

    insert into public.journal_lines (journal_id, line_number, account_id, project_id, description, debit, credit, created_by)
    values
      (
        v_journal_id, 1,
        case when p_entry_type = 'expense' then p_category_account_id else p_payment_account_id end,
        p_project_id, btrim(p_description),
        v_normalized_amount, 0,
        (select auth.uid())
      ),
      (
        v_journal_id, 2,
        case when p_entry_type = 'expense' then p_payment_account_id else p_category_account_id end,
        p_project_id, btrim(p_description),
        0, v_normalized_amount,
        (select auth.uid())
      );

    -- Re-post the journal
    update public.journals
    set status = 'posted'
    where id = v_journal_id;
  end if;
end;
$$;

revoke all on function public.update_single_line_entry(uuid, date, uuid, text, uuid, text, text, uuid, numeric) from public;
grant execute on function public.update_single_line_entry(uuid, date, uuid, text, uuid, text, text, uuid, numeric) to authenticated;

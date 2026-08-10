-- Normalize the two RPCs that were reconciled directly in production so the
-- pending Finance Roles V3 migration can apply its guarded role upgrade in the
-- same way on fresh databases and production.
--
-- This migration is intentionally ordered after the reconciliation recorded as
-- 20260810123851 and before 20260810200000_unify_finance_roles.sql.
-- It temporarily restores the historical admin/accountant guard only; V3 is
-- responsible for adding super_admin immediately afterwards.

begin;

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
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    not in ('admin', 'accountant') then
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
    coalesce(
      nullif(btrim(reversal_description), ''),
      'Reversal of journal ' || original.journal_number
    ),
    'draft',
    original.project_id,
    'journal_reversal',
    original.id,
    original.id,
    (select auth.uid())
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
    (select auth.uid())
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

create or replace function public.import_journal_entries_atomic(p_rows jsonb)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer');
  v_row jsonb;
  v_entry_id uuid;
  v_entry_ids uuid[] := array[]::uuid[];
  v_excel_row integer;
  v_index integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  if v_role not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to import journal entries'
      using errcode = '42501';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Import payload must be a JSON array'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    raise exception 'Import payload cannot be empty'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_rows) > 1000 then
    raise exception 'Import payload exceeds the maximum of 1000 rows'
      using errcode = '22023';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_index := v_index + 1;
    v_excel_row := coalesce(
      nullif(v_row ->> 'excel_row', '')::integer,
      v_index + 1
    );

    begin
      if nullif(trim(v_row ->> 'request_id'), '') is null then
        raise exception 'request_id is required';
      end if;

      if nullif(trim(v_row ->> 'entry_date'), '') is null then
        raise exception 'entry_date is required';
      end if;

      if coalesce(v_row ->> 'entry_type', '') not in ('income', 'expense') then
        raise exception 'entry_type must be income or expense';
      end if;

      if nullif(trim(v_row ->> 'project_id'), '') is null
        or nullif(trim(v_row ->> 'category_account_id'), '') is null
        or nullif(trim(v_row ->> 'payment_account_id'), '') is null then
        raise exception 'project and account identifiers are required';
      end if;

      if nullif(trim(v_row ->> 'description'), '') is null then
        raise exception 'description is required';
      end if;

      if coalesce((v_row ->> 'amount')::numeric, 0) <= 0 then
        raise exception 'amount must be greater than zero';
      end if;

      v_entry_id := public.post_single_line_entry(
        (v_row ->> 'request_id')::uuid,
        (v_row ->> 'entry_date')::date,
        (v_row ->> 'project_id')::uuid,
        v_row ->> 'entry_type',
        (v_row ->> 'category_account_id')::uuid,
        trim(v_row ->> 'description'),
        coalesce(trim(v_row ->> 'contractor_name'), ''),
        (v_row ->> 'payment_account_id')::uuid,
        (v_row ->> 'amount')::numeric
      );

      if nullif(trim(v_row ->> 'notes'), '') is not null then
        update public.entries
        set notes = trim(v_row ->> 'notes')
        where id = v_entry_id;
      end if;

      v_entry_ids := array_append(v_entry_ids, v_entry_id);
    exception
      when others then
        raise exception 'Excel row % failed: %', v_excel_row, sqlerrm
          using errcode = sqlstate;
    end;
  end loop;

  return v_entry_ids;
end;
$$;

revoke all on function public.import_journal_entries_atomic(jsonb) from public;
grant execute on function public.import_journal_entries_atomic(jsonb) to authenticated;

comment on function public.import_journal_entries_atomic(jsonb) is
  'Atomically posts up to 1000 validated single-line journal entries. Any row failure rolls back the entire import.';

commit;

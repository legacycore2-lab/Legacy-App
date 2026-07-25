-- Legacy Core ERP
-- Document functions that existed in the database without a migration file.
-- These were created directly via SQL Editor and are now tracked here.
-- No functional changes — definitions match exactly what is in production.

-- ---------------------------------------------------------------------------
-- 1. set_updated_at
--    Generic trigger function used by multiple tables.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. enforce_new_journal_draft
--    Ensures every new journal is created with draft status and no posting metadata.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_new_journal_draft()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if new.status <> 'draft' then
    raise exception 'New journals must be created with draft status';
  end if;

  if new.posted_at is not null or new.posted_by is not null then
    raise exception 'New draft journals cannot contain posting metadata';
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. validate_journal_status_transition
--    Enforces allowed status transitions: draft→posted→reversed (final).
--    Validates balance and accounts before posting.
-- ---------------------------------------------------------------------------
create or replace function public.validate_journal_status_transition()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  total_debit  numeric(18, 2);
  total_credit numeric(18, 2);
  lines_count  integer;
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'draft' and new.status <> 'posted' then
    raise exception 'Draft journal can only transition to posted';
  end if;

  if old.status = 'posted' and new.status <> 'reversed' then
    raise exception 'Posted journal can only transition to reversed';
  end if;

  if old.status = 'reversed' then
    raise exception 'Reversed journal status cannot be changed';
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
  end if;

  if old.status = 'posted' and new.status = 'reversed' then
    if not exists (
      select 1
      from public.journals reversal
      where reversal.reversal_of_id = old.id
        and reversal.status = 'posted'
    ) then
      raise exception 'A posted reversal journal must exist before marking the original journal as reversed';
    end if;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. validate_account_parent
--    Ensures account hierarchy integrity: type match and level = parent + 1.
-- ---------------------------------------------------------------------------
create or replace function public.validate_account_parent()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  parent_account_type text;
  parent_level        smallint;
begin
  if new.parent_id is null then
    if new.level <> 1 then
      raise exception 'Root accounts must have level 1';
    end if;
    return new;
  end if;

  select account_type, level
  into parent_account_type, parent_level
  from public.accounts
  where id = new.parent_id;

  if not found then
    raise exception 'Parent account does not exist';
  end if;

  if parent_account_type <> new.account_type then
    raise exception 'Child account type must match parent account type';
  end if;

  if new.level <> parent_level + 1 then
    raise exception 'Account level must equal parent level plus one';
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 5. prevent_account_cycle
--    Prevents circular references in the accounts hierarchy.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_account_cycle()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  cycle_found boolean;
begin
  if new.parent_id is null then
    return new;
  end if;

  with recursive account_tree as (
    select id, parent_id
    from public.accounts
    where id = new.parent_id

    union all

    select a.id, a.parent_id
    from public.accounts a
    join account_tree tree on a.id = tree.parent_id
  )
  select exists (
    select 1 from account_tree where id = new.id
  ) into cycle_found;

  if cycle_found then
    raise exception 'Account hierarchy cannot contain a circular reference';
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 6. delete_single_line_entry
--    Deletes a draft entry with its journal and lines (no audit log).
--    For posted entries use force_delete_single_line_entry instead.
-- ---------------------------------------------------------------------------
create or replace function public.delete_single_line_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_journal_id uuid;
begin
  select j.id into v_journal_id
  from public.journals j
  where j.source_type = 'single_line_entry'
    and j.source_id = p_entry_id
  limit 1;

  if v_journal_id is not null then
    delete from public.journal_lines where journal_id = v_journal_id;
    delete from public.journals where id = v_journal_id;
  end if;

  delete from public.entries where id = p_entry_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 7. update_single_line_entry
--    Updates an existing entry and rebuilds its journal lines.
--    Temporarily disables triggers to allow modification of posted journals.
-- ---------------------------------------------------------------------------
create or replace function public.update_single_line_entry(
  p_entry_id            uuid,
  p_entry_date          date,
  p_project_id          uuid,
  p_entry_type          text,
  p_category_account_id uuid,
  p_description         text,
  p_contractor_name     text,
  p_payment_account_id  uuid,
  p_amount              numeric
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_journal_id        uuid;
  v_normalized_amount numeric(18, 2);
  v_category_label    text;
  v_payment_label     text;
begin
  v_normalized_amount := round(p_amount, 2);

  select code || ' - ' || name_ar into v_category_label
  from public.accounts
  where id = p_category_account_id and is_active and is_postable;

  select code || ' - ' || name_ar into v_payment_label
  from public.accounts
  where id = p_payment_account_id and is_active and is_postable;

  update public.entries set
    entry_date      = p_entry_date,
    entry_type      = p_entry_type,
    category        = v_category_label,
    description     = btrim(p_description),
    contractor_name = nullif(btrim(p_contractor_name), ''),
    payment_method  = v_payment_label,
    amount          = v_normalized_amount,
    project_id      = p_project_id
  where id = p_entry_id;

  select id into v_journal_id
  from public.journals
  where source_type = 'single_line_entry' and source_id = p_entry_id;

  if v_journal_id is not null then
    alter table public.journals     disable trigger all;
    alter table public.journal_lines disable trigger all;

    delete from public.journal_lines where journal_id = v_journal_id;

    update public.journals set
      journal_date = p_entry_date,
      description  = btrim(p_description),
      project_id   = p_project_id,
      status       = 'posted'
    where id = v_journal_id;

    insert into public.journal_lines (
      journal_id, line_number, account_id, project_id, description, debit, credit, created_by
    ) values
      (v_journal_id, 1,
       case when p_entry_type = 'expense' then p_category_account_id else p_payment_account_id end,
       p_project_id, btrim(p_description), v_normalized_amount, 0, auth.uid()),
      (v_journal_id, 2,
       case when p_entry_type = 'expense' then p_payment_account_id else p_category_account_id end,
       p_project_id, btrim(p_description), 0, v_normalized_amount, auth.uid());

    alter table public.journals     enable trigger all;
    alter table public.journal_lines enable trigger all;
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 8. reverse_journal_entry
--    Creates an audited reversal entry for a posted single-line journal.
--    Requires admin or accountant role.
-- ---------------------------------------------------------------------------
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
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') not in ('admin', 'accountant') then
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
    raise exception 'Entry not found' using errcode = '23503';
  end if;

  if v_journal.is_reversal then
    raise exception 'Reversal entries cannot be reversed' using errcode = '23514';
  end if;

  if v_journal.journal_status = 'reversed' then
    raise exception 'Entry is already reversed' using errcode = '23514';
  end if;

  if v_journal.journal_status != 'posted' then
    raise exception 'Only posted entries can be reversed' using errcode = '23514';
  end if;

  insert into public.entries (
    entry_date, entry_type, category, description,
    contractor_name, payment_method, amount, project_id,
    created_by, is_reversal, reversal_of_entry_id
  ) values (
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
  ) returning id into v_new_entry_id;

  insert into public.journals (
    journal_date, description, status, project_id,
    source_type, source_id, created_by, reversal_of
  ) values (
    current_date,
    'عكس: ' || coalesce(v_journal.journal_description, ''),
    'draft',
    v_journal.journal_project_id,
    'single_line_entry',
    v_new_entry_id,
    auth.uid(),
    v_journal.journal_id
  ) returning id into v_reversal_id;

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
  set status = 'posted', posted_at = now()
  where id = v_reversal_id;

  update public.journals
  set status = 'reversed', reversed_by = v_reversal_id
  where id = v_journal.journal_id;

  return v_new_entry_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 9. rls_auto_enable (event trigger)
--    Automatically enables RLS on every new table created in public schema.
-- ---------------------------------------------------------------------------
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null
      and cmd.schema_name in ('public')
      and cmd.schema_name not in ('pg_catalog', 'information_schema')
      and cmd.schema_name not like 'pg_toast%'
      and cmd.schema_name not like 'pg_temp%'
    then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (system schema or not enforced: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$function$;

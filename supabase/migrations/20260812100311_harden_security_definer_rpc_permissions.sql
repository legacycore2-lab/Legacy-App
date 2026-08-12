begin;

create or replace function public.update_single_line_entry(
  p_entry_id uuid,
  p_entry_date date,
  p_project_id uuid,
  p_entry_type text,
  p_category_account_id uuid,
  p_description text,
  p_contractor_name text,
  p_payment_account_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer');
  v_journal_id uuid;
  v_normalized_amount numeric(18,2);
  v_category_label text;
  v_payment_label text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to update journal entries' using errcode = '42501';
  end if;

  v_normalized_amount := round(p_amount, 2);

  select code || ' - ' || name_ar into v_category_label
  from public.accounts
  where id = p_category_account_id and is_active and is_postable;

  select code || ' - ' || name_ar into v_payment_label
  from public.accounts
  where id = p_payment_account_id and is_active and is_postable;

  update public.entries set
    entry_date = p_entry_date,
    entry_type = p_entry_type,
    category = v_category_label,
    description = btrim(p_description),
    contractor_name = nullif(btrim(p_contractor_name), ''),
    payment_method = v_payment_label,
    amount = v_normalized_amount,
    project_id = p_project_id
  where id = p_entry_id;

  select id into v_journal_id from public.journals
  where source_type = 'single_line_entry' and source_id = p_entry_id;

  if v_journal_id is not null then
    alter table public.journals disable trigger all;
    alter table public.journal_lines disable trigger all;

    delete from public.journal_lines where journal_id = v_journal_id;

    update public.journals set
      journal_date = p_entry_date,
      description = btrim(p_description),
      project_id = p_project_id,
      status = 'posted'
    where id = v_journal_id;

    insert into public.journal_lines (journal_id, line_number, account_id, project_id, description, debit, credit, created_by)
    values
      (v_journal_id, 1,
       case when p_entry_type = 'expense' then p_category_account_id else p_payment_account_id end,
       p_project_id, btrim(p_description), v_normalized_amount, 0, auth.uid()),
      (v_journal_id, 2,
       case when p_entry_type = 'expense' then p_payment_account_id else p_category_account_id end,
       p_project_id, btrim(p_description), 0, v_normalized_amount, auth.uid());

    alter table public.journals enable trigger all;
    alter table public.journal_lines enable trigger all;
  end if;
end;
$function$;

create or replace function public.delete_single_line_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer');
  v_journal_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if v_role not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to delete journal entries' using errcode = '42501';
  end if;

  select j.id
  into v_journal_id
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

revoke execute on function public.apply_configured_project_numbering() from public, anon, authenticated;
revoke execute on function public.prevent_posted_cash_bank_transaction_mutation() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

revoke execute on function public.import_journal_entries_atomic(jsonb) from public, anon;
grant execute on function public.import_journal_entries_atomic(jsonb) to authenticated;

revoke execute on function public.update_system_settings(jsonb) from public, anon;
grant execute on function public.update_system_settings(jsonb) to authenticated;

revoke execute on function public.force_delete_single_line_entry(uuid, text) from public, anon;
grant execute on function public.force_delete_single_line_entry(uuid, text) to authenticated;

revoke execute on function public.update_single_line_entry(uuid, date, uuid, text, uuid, text, text, uuid, numeric) from public, anon;
grant execute on function public.update_single_line_entry(uuid, date, uuid, text, uuid, text, text, uuid, numeric) to authenticated;

revoke execute on function public.delete_single_line_entry(uuid) from public, anon;
grant execute on function public.delete_single_line_entry(uuid) to authenticated;

commit;

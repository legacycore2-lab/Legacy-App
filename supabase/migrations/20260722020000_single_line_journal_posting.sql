-- Post a user-friendly single-line transaction as a balanced journal atomically.

create or replace function public.post_single_line_entry(
  entry_date date,
  project_name text,
  entry_type text,
  category_account text,
  description text,
  contractor_name text,
  payment_account text,
  amount numeric
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  selected_project_id uuid;
  category_account_id uuid;
  payment_account_id uuid;
  legacy_entry_id uuid;
  journal_id uuid;
  normalized_amount numeric(18, 2);
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to post journal entries'
      using errcode = '42501';
  end if;

  if entry_date is null or btrim(project_name) = '' or btrim(description) = '' then
    raise exception 'Date, project, and description are required'
      using errcode = '22023';
  end if;

  if entry_type not in ('income', 'expense') then
    raise exception 'Entry type must be income or expense'
      using errcode = '22023';
  end if;

  normalized_amount := round(amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero'
      using errcode = '22023';
  end if;

  select id
  into selected_project_id
  from public.projects
  where not is_archived
    and lower(name) = lower(btrim(project_name))
  limit 1;

  if selected_project_id is null then
    raise exception 'Project not found or archived'
      using errcode = '23503';
  end if;

  select id
  into category_account_id
  from public.accounts
  where is_active
    and is_postable
    and account_type = case when entry_type = 'expense' then 'expense' else 'revenue' end
    and (
      lower(code) = lower(btrim(category_account))
      or lower(name_ar) = lower(btrim(category_account))
      or lower(coalesce(name_en, '')) = lower(btrim(category_account))
    )
  limit 1;

  if category_account_id is null then
    raise exception 'Category account not found, inactive, or incompatible'
      using errcode = '23503';
  end if;

  select id
  into payment_account_id
  from public.accounts
  where is_active
    and is_postable
    and account_type = 'asset'
    and (
      lower(code) = lower(btrim(payment_account))
      or lower(name_ar) = lower(btrim(payment_account))
      or lower(coalesce(name_en, '')) = lower(btrim(payment_account))
    )
  limit 1;

  if payment_account_id is null then
    raise exception 'Payment account not found, inactive, or incompatible'
      using errcode = '23503';
  end if;

  if payment_account_id = category_account_id then
    raise exception 'Journal sides must use different accounts'
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
    created_by
  )
  values (
    entry_date,
    entry_type,
    btrim(category_account),
    btrim(description),
    nullif(btrim(contractor_name), ''),
    btrim(payment_account),
    normalized_amount,
    selected_project_id,
    (select auth.uid())
  )
  returning id into legacy_entry_id;

  insert into public.journals (
    journal_date,
    description,
    status,
    project_id,
    source_type,
    source_id,
    created_by
  )
  values (
    entry_date,
    btrim(description),
    'draft',
    selected_project_id,
    'single_line_entry',
    legacy_entry_id,
    (select auth.uid())
  )
  returning id into journal_id;

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
  values
    (
      journal_id,
      1,
      case when entry_type = 'expense' then category_account_id else payment_account_id end,
      selected_project_id,
      btrim(description),
      normalized_amount,
      0,
      (select auth.uid())
    ),
    (
      journal_id,
      2,
      case when entry_type = 'expense' then payment_account_id else category_account_id end,
      selected_project_id,
      btrim(description),
      0,
      normalized_amount,
      (select auth.uid())
    );

  update public.journals
  set status = 'posted'
  where id = journal_id;

  return legacy_entry_id;
end;
$$;

revoke all on function public.post_single_line_entry(date, text, text, text, text, text, text, numeric) from public;
grant execute on function public.post_single_line_entry(date, text, text, text, text, text, text, numeric) to authenticated;

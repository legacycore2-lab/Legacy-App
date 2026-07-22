-- Post a single-line transaction using stable identifiers and an idempotency key.

alter table public.entries
  add column if not exists client_request_id uuid;

create unique index if not exists entries_client_request_id_uidx
  on public.entries(client_request_id)
  where client_request_id is not null;

create or replace function public.post_single_line_entry(
  p_client_request_id uuid,
  p_entry_date date,
  p_project_id uuid,
  p_entry_type text,
  p_category_account_id uuid,
  p_description text,
  p_contractor_name text,
  p_payment_account_id uuid,
  p_amount numeric
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  legacy_entry_id uuid;
  generated_journal_id uuid;
  normalized_amount numeric(18, 2);
  category_account_label text;
  payment_account_label text;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('admin', 'accountant') then
    raise exception 'Insufficient permissions to post journal entries'
      using errcode = '42501';
  end if;

  if p_client_request_id is null or p_entry_date is null or p_project_id is null or btrim(p_description) = '' then
    raise exception 'Request, date, project, and description are required'
      using errcode = '22023';
  end if;

  if p_entry_type not in ('income', 'expense') then
    raise exception 'Entry type must be income or expense'
      using errcode = '22023';
  end if;

  normalized_amount := round(p_amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and not is_archived
  ) then
    raise exception 'Project not found or archived'
      using errcode = '23503';
  end if;

  select code || ' - ' || name_ar
  into category_account_label
  from public.accounts
  where id = p_category_account_id
    and is_active
    and is_postable
    and account_type = case when p_entry_type = 'expense' then 'expense' else 'revenue' end;

  if category_account_label is null then
    raise exception 'Category account not found, inactive, or incompatible'
      using errcode = '23503';
  end if;

  select code || ' - ' || name_ar
  into payment_account_label
  from public.accounts
  where id = p_payment_account_id
    and is_active
    and is_postable
    and account_type = 'asset';

  if payment_account_label is null then
    raise exception 'Payment account not found, inactive, or incompatible'
      using errcode = '23503';
  end if;

  if p_payment_account_id = p_category_account_id then
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
    created_by,
    client_request_id
  )
  values (
    p_entry_date,
    p_entry_type,
    category_account_label,
    btrim(p_description),
    nullif(btrim(p_contractor_name), ''),
    payment_account_label,
    normalized_amount,
    p_project_id,
    (select auth.uid()),
    p_client_request_id
  )
  on conflict (client_request_id) where client_request_id is not null do nothing
  returning id into legacy_entry_id;

  if legacy_entry_id is null then
    select id
    into legacy_entry_id
    from public.entries
    where client_request_id = p_client_request_id
      and created_by = (select auth.uid());

    if legacy_entry_id is null then
      raise exception 'Request identifier is already in use'
        using errcode = '23505';
    end if;

    return legacy_entry_id;
  end if;

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
    p_entry_date,
    btrim(p_description),
    'draft',
    p_project_id,
    'single_line_entry',
    legacy_entry_id,
    (select auth.uid())
  )
  returning id into generated_journal_id;

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
      generated_journal_id,
      1,
      case when p_entry_type = 'expense' then p_category_account_id else p_payment_account_id end,
      p_project_id,
      btrim(p_description),
      normalized_amount,
      0,
      (select auth.uid())
    ),
    (
      generated_journal_id,
      2,
      case when p_entry_type = 'expense' then p_payment_account_id else p_category_account_id end,
      p_project_id,
      btrim(p_description),
      0,
      normalized_amount,
      (select auth.uid())
    );

  update public.journals
  set status = 'posted'
  where id = generated_journal_id;

  return legacy_entry_id;
end;
$$;

revoke all on function public.post_single_line_entry(uuid, date, uuid, text, uuid, text, text, uuid, numeric)
  from public;
grant execute on function public.post_single_line_entry(uuid, date, uuid, text, uuid, text, text, uuid, numeric)
  to authenticated;

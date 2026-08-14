-- Unify finance roles and harden callable routines.
-- super_admin is a superset of admin; viewer has no financial-data access.

drop policy if exists projects_insert_finance on public.projects;
drop policy if exists projects_update_finance on public.projects;
drop policy if exists projects_delete_admin on public.projects;
create policy projects_insert_finance on public.projects for insert to authenticated with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy projects_update_finance on public.projects for update to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy projects_delete_admin on public.projects for delete to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin'));

drop policy if exists entries_select_finance on public.entries;
drop policy if exists entries_insert_finance on public.entries;
drop policy if exists entries_update_finance on public.entries;
drop policy if exists entries_delete_admin on public.entries;
create policy entries_select_finance on public.entries for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy entries_insert_finance on public.entries for insert to authenticated with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy entries_update_finance on public.entries for update to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy entries_delete_admin on public.entries for delete to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin'));

drop policy if exists journals_select_finance on public.journals;
drop policy if exists journals_insert_finance on public.journals;
drop policy if exists journals_update_finance on public.journals;
drop policy if exists journals_authenticated_select on public.journals;
drop policy if exists journals_authenticated_insert on public.journals;
drop policy if exists journals_authenticated_update on public.journals;
create policy journals_select_finance on public.journals for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy journals_insert_finance on public.journals for insert to authenticated with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy journals_update_finance on public.journals for update to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

drop policy if exists journal_lines_select_finance on public.journal_lines;
drop policy if exists journal_lines_insert_finance on public.journal_lines;
drop policy if exists journal_lines_update_finance on public.journal_lines;
drop policy if exists journal_lines_delete_finance on public.journal_lines;
drop policy if exists journal_lines_authenticated_select on public.journal_lines;
drop policy if exists journal_lines_authenticated_insert on public.journal_lines;
drop policy if exists journal_lines_authenticated_update on public.journal_lines;
drop policy if exists journal_lines_authenticated_delete on public.journal_lines;
create policy journal_lines_select_finance on public.journal_lines for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy journal_lines_insert_finance on public.journal_lines for insert to authenticated with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy journal_lines_update_finance on public.journal_lines for update to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy journal_lines_delete_finance on public.journal_lines for delete to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

drop policy if exists accounts_insert_finance on public.accounts;
drop policy if exists accounts_update_finance on public.accounts;
drop policy if exists accounts_select_finance on public.accounts;
drop policy if exists accounts_authenticated_select on public.accounts;
drop policy if exists accounts_authenticated_insert on public.accounts;
drop policy if exists accounts_authenticated_update on public.accounts;
create policy accounts_select_finance on public.accounts for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy accounts_insert_finance on public.accounts for insert to authenticated with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy accounts_update_finance on public.accounts for update to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

drop policy if exists cash_bank_accounts_select_authenticated on public.cash_bank_accounts;
drop policy if exists cash_bank_accounts_select_finance on public.cash_bank_accounts;
drop policy if exists cash_bank_accounts_write_finance on public.cash_bank_accounts;
create policy cash_bank_accounts_select_finance on public.cash_bank_accounts for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy cash_bank_accounts_write_finance on public.cash_bank_accounts for all to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

drop policy if exists cash_bank_transactions_select_authenticated on public.cash_bank_transactions;
drop policy if exists cash_bank_transactions_select_finance on public.cash_bank_transactions;
drop policy if exists cash_bank_transactions_write_finance on public.cash_bank_transactions;
create policy cash_bank_transactions_select_finance on public.cash_bank_transactions for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy cash_bank_transactions_write_finance on public.cash_bank_transactions for all to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

drop policy if exists entry_attachments_select_finance on public.entry_attachments;
drop policy if exists entry_attachments_insert_finance on public.entry_attachments;
drop policy if exists entry_attachments_delete_finance on public.entry_attachments;
create policy entry_attachments_select_finance on public.entry_attachments for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy entry_attachments_insert_finance on public.entry_attachments for insert to authenticated with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant') and created_by=(select auth.uid()));
create policy entry_attachments_delete_finance on public.entry_attachments for delete to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

drop policy if exists entry_attachments_objects_select_finance on storage.objects;
drop policy if exists entry_attachments_objects_insert_finance on storage.objects;
drop policy if exists entry_attachments_objects_update_finance on storage.objects;
drop policy if exists entry_attachments_objects_delete_finance on storage.objects;
create policy entry_attachments_objects_select_finance on storage.objects for select to authenticated using (bucket_id='entry-attachments' and coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy entry_attachments_objects_insert_finance on storage.objects for insert to authenticated with check (bucket_id='entry-attachments' and (storage.foldername(name))[1]='entries' and coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant') and exists (select 1 from public.entries where id::text=(storage.foldername(name))[2]));
create policy entry_attachments_objects_update_finance on storage.objects for update to authenticated using (bucket_id='entry-attachments' and coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant')) with check (bucket_id='entry-attachments' and (storage.foldername(name))[1]='entries' and coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy entry_attachments_objects_delete_finance on storage.objects for delete to authenticated using (bucket_id='entry-attachments' and coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

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
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('super_admin', 'admin', 'accountant') then
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

create or replace function public.post_cash_bank_deposit(
  p_client_request_id uuid,
  p_destination_account_id uuid,
  p_offset_account_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_description text,
  p_reference_number text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  generated_transaction_id uuid;
  generated_journal_id uuid;
  destination_ledger_account_id uuid;
  normalized_amount numeric(18, 2);
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to post cash or bank deposits'
      using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_destination_account_id is null
    or p_offset_account_id is null
    or p_transaction_date is null
    or btrim(coalesce(p_description, '')) = '' then
    raise exception 'Request, accounts, date, and description are required'
      using errcode = '22023';
  end if;

  normalized_amount := round(p_amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero'
      using errcode = '22023';
  end if;

  select cash_account.ledger_account_id
  into destination_ledger_account_id
  from public.cash_bank_accounts cash_account
  join public.accounts ledger_account
    on ledger_account.id = cash_account.ledger_account_id
  where cash_account.id = p_destination_account_id
    and cash_account.is_active
    and cash_account.currency_code = 'EGP'
    and ledger_account.is_active
    and ledger_account.is_postable
    and ledger_account.account_type = 'asset';

  if destination_ledger_account_id is null then
    raise exception 'Destination cash or bank account is unavailable'
      using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.accounts offset_account
    where offset_account.id = p_offset_account_id
      and offset_account.is_active
      and offset_account.is_postable
  ) then
    raise exception 'Offset account is unavailable'
      using errcode = '23503';
  end if;

  if destination_ledger_account_id = p_offset_account_id then
    raise exception 'Destination and offset ledger accounts must be different'
      using errcode = '23514';
  end if;

  insert into public.cash_bank_transactions (
    transaction_date,
    transaction_type,
    destination_account_id,
    amount,
    description,
    reference_number,
    status,
    created_by,
    client_request_id
  )
  values (
    p_transaction_date,
    'deposit',
    p_destination_account_id,
    normalized_amount,
    btrim(p_description),
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    'draft',
    (select auth.uid()),
    p_client_request_id
  )
  on conflict (client_request_id) where client_request_id is not null do nothing
  returning id into generated_transaction_id;

  if generated_transaction_id is null then
    select movement.id
    into generated_transaction_id
    from public.cash_bank_transactions movement
    where movement.client_request_id = p_client_request_id
      and movement.created_by = (select auth.uid())
      and movement.transaction_type = 'deposit';

    if generated_transaction_id is null then
      raise exception 'Request identifier is already in use'
        using errcode = '23505';
    end if;

    return generated_transaction_id;
  end if;

  insert into public.journals (
    journal_date,
    description,
    status,
    source_type,
    source_id,
    created_by
  )
  values (
    p_transaction_date,
    btrim(p_description),
    'draft',
    'cash_bank_deposit',
    generated_transaction_id,
    (select auth.uid())
  )
  returning id into generated_journal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    description,
    debit,
    credit,
    created_by
  )
  values
    (
      generated_journal_id,
      1,
      destination_ledger_account_id,
      btrim(p_description),
      normalized_amount,
      0,
      (select auth.uid())
    ),
    (
      generated_journal_id,
      2,
      p_offset_account_id,
      btrim(p_description),
      0,
      normalized_amount,
      (select auth.uid())
    );

  update public.journals
  set status = 'posted'
  where id = generated_journal_id;

  update public.cash_bank_transactions
  set
    status = 'posted',
    journal_id = generated_journal_id,
    posted_at = now()
  where id = generated_transaction_id;

  return generated_transaction_id;
end;
$$;

create or replace function public.post_cash_bank_withdrawal(
  p_client_request_id uuid,
  p_source_account_id uuid,
  p_offset_account_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_description text,
  p_reference_number text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  generated_transaction_id uuid;
  generated_journal_id uuid;
  source_ledger_account_id uuid;
  normalized_amount numeric(18, 2);
  available_balance numeric(18, 2);
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to post cash or bank withdrawals'
      using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_source_account_id is null
    or p_offset_account_id is null
    or p_transaction_date is null
    or btrim(coalesce(p_description, '')) = '' then
    raise exception 'Request, accounts, date, and description are required'
      using errcode = '22023';
  end if;

  normalized_amount := round(p_amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero'
      using errcode = '22023';
  end if;

  -- Serializes withdrawals from the same operational account so concurrent
  -- requests cannot both spend the same available balance.
  select cash_account.ledger_account_id
  into source_ledger_account_id
  from public.cash_bank_accounts cash_account
  join public.accounts ledger_account
    on ledger_account.id = cash_account.ledger_account_id
  where cash_account.id = p_source_account_id
    and cash_account.is_active
    and cash_account.currency_code = 'EGP'
    and ledger_account.is_active
    and ledger_account.is_postable
    and ledger_account.account_type = 'asset'
  for update of cash_account;

  if source_ledger_account_id is null then
    raise exception 'Source cash or bank account is unavailable'
      using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.accounts offset_account
    where offset_account.id = p_offset_account_id
      and offset_account.is_active
      and offset_account.is_postable
  ) then
    raise exception 'Offset account is unavailable'
      using errcode = '23503';
  end if;

  if source_ledger_account_id = p_offset_account_id then
    raise exception 'Source and offset ledger accounts must be different'
      using errcode = '23514';
  end if;

  select cash_account.opening_balance
    + coalesce(sum(
        case
          when movement.status = 'posted' and movement.destination_account_id = cash_account.id
            then movement.amount
          when movement.status = 'posted' and movement.source_account_id = cash_account.id
            then -movement.amount
          else 0
        end
      ), 0)
  into available_balance
  from public.cash_bank_accounts cash_account
  left join public.cash_bank_transactions movement
    on movement.source_account_id = cash_account.id
    or movement.destination_account_id = cash_account.id
  where cash_account.id = p_source_account_id
  group by cash_account.id;

  if available_balance < normalized_amount then
    raise exception 'Insufficient cash or bank account balance'
      using errcode = '23514';
  end if;

  insert into public.cash_bank_transactions (
    transaction_date,
    transaction_type,
    source_account_id,
    amount,
    description,
    reference_number,
    status,
    created_by,
    client_request_id
  )
  values (
    p_transaction_date,
    'withdrawal',
    p_source_account_id,
    normalized_amount,
    btrim(p_description),
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    'draft',
    (select auth.uid()),
    p_client_request_id
  )
  on conflict (client_request_id) where client_request_id is not null do nothing
  returning id into generated_transaction_id;

  if generated_transaction_id is null then
    select movement.id
    into generated_transaction_id
    from public.cash_bank_transactions movement
    where movement.client_request_id = p_client_request_id
      and movement.created_by = (select auth.uid())
      and movement.transaction_type = 'withdrawal';

    if generated_transaction_id is null then
      raise exception 'Request identifier is already in use'
        using errcode = '23505';
    end if;

    return generated_transaction_id;
  end if;

  insert into public.journals (
    journal_date,
    description,
    status,
    source_type,
    source_id,
    created_by
  )
  values (
    p_transaction_date,
    btrim(p_description),
    'draft',
    'cash_bank_withdrawal',
    generated_transaction_id,
    (select auth.uid())
  )
  returning id into generated_journal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    description,
    debit,
    credit,
    created_by
  )
  values
    (
      generated_journal_id,
      1,
      p_offset_account_id,
      btrim(p_description),
      normalized_amount,
      0,
      (select auth.uid())
    ),
    (
      generated_journal_id,
      2,
      source_ledger_account_id,
      btrim(p_description),
      0,
      normalized_amount,
      (select auth.uid())
    );

  update public.journals
  set status = 'posted'
  where id = generated_journal_id;

  update public.cash_bank_transactions
  set
    status = 'posted',
    journal_id = generated_journal_id,
    posted_at = now()
  where id = generated_transaction_id;

  return generated_transaction_id;
end;
$$;

create or replace function public.post_cash_bank_transfer(
  p_client_request_id uuid,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_description text,
  p_reference_number text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  generated_transaction_id uuid;
  generated_journal_id uuid;
  source_ledger_account_id uuid;
  destination_ledger_account_id uuid;
  normalized_amount numeric(18, 2);
  available_balance numeric(18, 2);
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to post cash or bank transfers'
      using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_source_account_id is null
    or p_destination_account_id is null
    or p_transaction_date is null
    or btrim(coalesce(p_description, '')) = '' then
    raise exception 'Request, accounts, date, and description are required'
      using errcode = '22023';
  end if;

  if p_source_account_id = p_destination_account_id then
    raise exception 'Source and destination accounts must be different'
      using errcode = '23514';
  end if;

  normalized_amount := round(p_amount, 2);
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Amount must be greater than zero'
      using errcode = '22023';
  end if;

  -- A deterministic lock order prevents deadlocks for opposite transfers and
  -- serializes balance-sensitive operations with withdrawals.
  perform account.id
  from public.cash_bank_accounts account
  where account.id in (p_source_account_id, p_destination_account_id)
  order by account.id
  for update;

  select account.ledger_account_id
  into source_ledger_account_id
  from public.cash_bank_accounts account
  join public.accounts ledger on ledger.id = account.ledger_account_id
  where account.id = p_source_account_id
    and account.is_active
    and account.currency_code = 'EGP'
    and ledger.is_active
    and ledger.is_postable
    and ledger.account_type = 'asset';

  select account.ledger_account_id
  into destination_ledger_account_id
  from public.cash_bank_accounts account
  join public.accounts ledger on ledger.id = account.ledger_account_id
  where account.id = p_destination_account_id
    and account.is_active
    and account.currency_code = 'EGP'
    and ledger.is_active
    and ledger.is_postable
    and ledger.account_type = 'asset';

  if source_ledger_account_id is null or destination_ledger_account_id is null then
    raise exception 'Source or destination cash/bank account is unavailable'
      using errcode = '23503';
  end if;

  if source_ledger_account_id = destination_ledger_account_id then
    raise exception 'Source and destination ledger accounts must be different'
      using errcode = '23514';
  end if;

  select account.opening_balance
    + coalesce(sum(
        case
          when movement.status = 'posted' and movement.destination_account_id = account.id
            then movement.amount
          when movement.status = 'posted' and movement.source_account_id = account.id
            then -movement.amount
          else 0
        end
      ), 0)
  into available_balance
  from public.cash_bank_accounts account
  left join public.cash_bank_transactions movement
    on movement.source_account_id = account.id
    or movement.destination_account_id = account.id
  where account.id = p_source_account_id
  group by account.id;

  if available_balance < normalized_amount then
    raise exception 'Insufficient source cash or bank account balance'
      using errcode = '23514';
  end if;

  insert into public.cash_bank_transactions (
    transaction_date,
    transaction_type,
    source_account_id,
    destination_account_id,
    amount,
    description,
    reference_number,
    status,
    created_by,
    client_request_id
  )
  values (
    p_transaction_date,
    'transfer',
    p_source_account_id,
    p_destination_account_id,
    normalized_amount,
    btrim(p_description),
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    'draft',
    (select auth.uid()),
    p_client_request_id
  )
  on conflict (client_request_id) where client_request_id is not null do nothing
  returning id into generated_transaction_id;

  if generated_transaction_id is null then
    select movement.id
    into generated_transaction_id
    from public.cash_bank_transactions movement
    where movement.client_request_id = p_client_request_id
      and movement.created_by = (select auth.uid())
      and movement.transaction_type = 'transfer';

    if generated_transaction_id is null then
      raise exception 'Request identifier is already in use'
        using errcode = '23505';
    end if;

    return generated_transaction_id;
  end if;

  insert into public.journals (
    journal_date,
    description,
    status,
    source_type,
    source_id,
    created_by
  )
  values (
    p_transaction_date,
    btrim(p_description),
    'draft',
    'cash_bank_transfer',
    generated_transaction_id,
    (select auth.uid())
  )
  returning id into generated_journal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    description,
    debit,
    credit,
    created_by
  )
  values
    (
      generated_journal_id,
      1,
      destination_ledger_account_id,
      btrim(p_description),
      normalized_amount,
      0,
      (select auth.uid())
    ),
    (
      generated_journal_id,
      2,
      source_ledger_account_id,
      btrim(p_description),
      0,
      normalized_amount,
      (select auth.uid())
    );

  update public.journals
  set status = 'posted'
  where id = generated_journal_id;

  update public.cash_bank_transactions
  set
    status = 'posted',
    journal_id = generated_journal_id,
    posted_at = now()
  where id = generated_transaction_id;

  return generated_transaction_id;
end;
$$;

create or replace function public.reverse_cash_bank_transaction(
  p_client_request_id uuid,
  p_transaction_id uuid,
  p_reversal_date date,
  p_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  original public.cash_bank_transactions%rowtype;
  generated_transaction_id uuid;
  generated_journal_id uuid;
  reversal_type text;
  reversal_source_id uuid;
  reversal_destination_id uuid;
  available_balance numeric(18, 2);
  reversal_description text;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer')
    not in ('super_admin', 'admin', 'accountant') then
    raise exception 'Insufficient permissions to reverse cash or bank transactions'
      using errcode = '42501';
  end if;

  if p_client_request_id is null
    or p_transaction_id is null
    or p_reversal_date is null
    or btrim(coalesce(p_reason, '')) = '' then
    raise exception 'Request, transaction, date, and reason are required'
      using errcode = '22023';
  end if;

  select movement.id
  into generated_transaction_id
  from public.cash_bank_transactions movement
  where movement.client_request_id = p_client_request_id
    and movement.created_by = (select auth.uid())
    and movement.reversal_of_transaction_id = p_transaction_id;

  if generated_transaction_id is not null then
    return generated_transaction_id;
  end if;

  select movement.*
  into original
  from public.cash_bank_transactions movement
  where movement.id = p_transaction_id
  for update;

  if original.id is null then
    raise exception 'Original cash or bank transaction was not found'
      using errcode = '23503';
  end if;

  if original.status <> 'posted' or original.journal_id is null then
    raise exception 'Only posted transactions can be reversed'
      using errcode = '23514';
  end if;

  if original.reversal_of_transaction_id is not null then
    raise exception 'A reversal transaction cannot be reversed'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.cash_bank_transactions movement
    where movement.reversal_of_transaction_id = original.id
  ) then
    raise exception 'Transaction has already been reversed'
      using errcode = '23505';
  end if;

  if original.transaction_type = 'deposit' then
    reversal_type := 'withdrawal';
    reversal_source_id := original.destination_account_id;
    reversal_destination_id := null;
  elsif original.transaction_type = 'withdrawal' then
    reversal_type := 'deposit';
    reversal_source_id := null;
    reversal_destination_id := original.source_account_id;
  else
    reversal_type := 'transfer';
    reversal_source_id := original.destination_account_id;
    reversal_destination_id := original.source_account_id;
  end if;

  perform account.id
  from public.cash_bank_accounts account
  where account.id in (reversal_source_id, reversal_destination_id)
  order by account.id
  for update;

  if reversal_source_id is not null then
    select account.opening_balance
      + coalesce(sum(
          case
            when movement.status = 'posted' and movement.destination_account_id = account.id
              then movement.amount
            when movement.status = 'posted' and movement.source_account_id = account.id
              then -movement.amount
            else 0
          end
        ), 0)
    into available_balance
    from public.cash_bank_accounts account
    left join public.cash_bank_transactions movement
      on movement.source_account_id = account.id
      or movement.destination_account_id = account.id
    where account.id = reversal_source_id
      and account.is_active
      and account.currency_code = 'EGP'
    group by account.id;

    if available_balance is null or available_balance < original.amount then
      raise exception 'Insufficient balance to reverse the original transaction'
        using errcode = '23514';
    end if;
  end if;

  reversal_description := concat('Reversal: ', btrim(p_reason));

  insert into public.cash_bank_transactions (
    transaction_date,
    transaction_type,
    source_account_id,
    destination_account_id,
    amount,
    description,
    reference_number,
    status,
    created_by,
    client_request_id,
    reversal_of_transaction_id
  )
  values (
    p_reversal_date,
    reversal_type,
    reversal_source_id,
    reversal_destination_id,
    original.amount,
    reversal_description,
    original.reference_number,
    'draft',
    (select auth.uid()),
    p_client_request_id,
    original.id
  )
  returning id into generated_transaction_id;

  insert into public.journals (
    journal_date,
    description,
    status,
    source_type,
    source_id,
    created_by
  )
  values (
    p_reversal_date,
    reversal_description,
    'draft',
    'cash_bank_reversal',
    generated_transaction_id,
    (select auth.uid())
  )
  returning id into generated_journal_id;

  insert into public.journal_lines (
    journal_id,
    line_number,
    account_id,
    description,
    debit,
    credit,
    created_by
  )
  select
    generated_journal_id,
    original_line.line_number,
    original_line.account_id,
    reversal_description,
    original_line.credit,
    original_line.debit,
    (select auth.uid())
  from public.journal_lines original_line
  where original_line.journal_id = original.journal_id
  order by original_line.line_number;

  if not found then
    raise exception 'Original journal lines were not found'
      using errcode = '23503';
  end if;

  update public.journals
  set status = 'posted'
  where id = generated_journal_id;

  update public.cash_bank_transactions
  set
    status = 'posted',
    journal_id = generated_journal_id,
    posted_at = now()
  where id = generated_transaction_id;

  return generated_transaction_id;
end;
$$;

create or replace function public.post_advance(p_client_request_id uuid,p_holder_name text,p_holder_title text,p_project_ids uuid[],p_source_account_id uuid,p_advance_ledger_account_id uuid,p_issue_date date,p_due_date date,p_purpose text,p_amount numeric) returns uuid language plpgsql security invoker set search_path=public as $$
declare v_id uuid; v_cash_transaction uuid; v_project uuid;
begin
  if coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') not in ('super_admin','admin','accountant') then raise exception 'Insufficient permissions' using errcode='42501'; end if;
  if p_client_request_id is null or btrim(coalesce(p_holder_name,''))='' or cardinality(p_project_ids)=0 or p_advance_ledger_account_id is null then raise exception 'Required advance data is missing' using errcode='22023'; end if;
  if not exists(select 1 from public.accounts where id=p_advance_ledger_account_id and account_type='asset' and is_postable and is_active) then raise exception 'Advance ledger account is unavailable' using errcode='23503'; end if;
  v_cash_transaction := public.post_cash_bank_withdrawal(p_client_request_id,p_source_account_id,p_advance_ledger_account_id,p_issue_date,p_amount,'ØµØ±Ù Ø¹Ù‡Ø¯Ø©: '||btrim(p_holder_name),null);
  insert into public.advances(holder_name,holder_title,issue_date,due_date,purpose,amount,advance_ledger_account_id,issue_transaction_id)
  values(btrim(p_holder_name),nullif(btrim(coalesce(p_holder_title,'')),''),p_issue_date,p_due_date,btrim(p_purpose),round(p_amount,2),p_advance_ledger_account_id,v_cash_transaction) returning id into v_id;
  foreach v_project in array p_project_ids loop insert into public.advance_projects(advance_id,project_id) values(v_id,v_project); end loop;
  return v_id;
end $$;

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
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer') not in ('super_admin', 'admin', 'accountant') then
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

  if v_role not in ('super_admin', 'admin', 'accountant') then
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
    v_excel_row := coalesce(nullif(v_row ->> 'excel_row', '')::integer, v_index + 1);

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
    'Ø¹ÙƒØ³: ' || coalesce(v_journal.entry_description, ''),
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
    'Ø¹ÙƒØ³: ' || coalesce(v_journal.journal_description, ''),
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
    'Ø¹ÙƒØ³: ' || coalesce(description, ''),
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

-- Harden the callable finance surface.
revoke all on function public.post_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric) from public;
grant execute on function public.post_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric) to authenticated;
revoke all on function public.post_cash_bank_deposit(uuid,uuid,uuid,date,numeric,text,text) from public;
grant execute on function public.post_cash_bank_deposit(uuid,uuid,uuid,date,numeric,text,text) to authenticated;
revoke all on function public.post_cash_bank_withdrawal(uuid,uuid,uuid,date,numeric,text,text) from public;
grant execute on function public.post_cash_bank_withdrawal(uuid,uuid,uuid,date,numeric,text,text) to authenticated;
revoke all on function public.post_cash_bank_transfer(uuid,uuid,uuid,date,numeric,text,text) from public;
grant execute on function public.post_cash_bank_transfer(uuid,uuid,uuid,date,numeric,text,text) to authenticated;
revoke all on function public.reverse_cash_bank_transaction(uuid,uuid,date,text) from public;
grant execute on function public.reverse_cash_bank_transaction(uuid,uuid,date,text) to authenticated;
revoke all on function public.post_advance(uuid,text,text,uuid[],uuid,uuid,date,date,text,numeric) from public;
grant execute on function public.post_advance(uuid,text,text,uuid[],uuid,uuid,date,date,text,numeric) to authenticated;
revoke all on function public.reverse_posted_journal(uuid,date,text) from public;
grant execute on function public.reverse_posted_journal(uuid,date,text) to authenticated;
revoke all on function public.import_journal_entries_atomic(jsonb) from public;
grant execute on function public.import_journal_entries_atomic(jsonb) to authenticated;
revoke all on function public.reverse_journal_entry(uuid) from public;
grant execute on function public.reverse_journal_entry(uuid) to authenticated;

-- Retire unused legacy/unsafe entry points without deleting migration history.
revoke all on function public.post_single_line_entry(date,text,text,text,text,text,text,numeric) from public;
revoke execute on function public.post_single_line_entry(date,text,text,text,text,text,text,numeric) from authenticated;
revoke all on function public.delete_single_line_entry(uuid) from public;
revoke execute on function public.delete_single_line_entry(uuid) from authenticated;
revoke all on function public.update_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric) from public;
revoke execute on function public.update_single_line_entry(uuid,date,uuid,text,uuid,text,text,uuid,numeric) from authenticated;

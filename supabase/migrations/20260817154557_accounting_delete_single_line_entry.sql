-- Accounting-aware deletion for exceptional data-entry mistakes.
-- Removes the operational entry, journal and linked Cash & Banks movement in
-- one transaction while retaining complete snapshots in the existing audit log.

alter table public.journal_force_delete_audit
  add column if not exists cash_bank_transaction_snapshot jsonb,
  add column if not exists deletion_kind text not null default 'permanent';

alter table public.journal_force_delete_audit
  drop constraint if exists journal_force_delete_audit_deletion_kind_check;

alter table public.journal_force_delete_audit
  add constraint journal_force_delete_audit_deletion_kind_check
  check (deletion_kind in ('permanent', 'accounting_delete'));

create or replace function public.prevent_posted_cash_bank_transaction_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if current_setting('app.accounting_delete_cash_bank', true) = 'on'
    and tg_op = 'DELETE' then
    return old;
  end if;

  if old.status = 'posted' then
    raise exception
      'Cannot modify or delete a posted cash/bank transaction (id: %). '
      'Use an approved reversal RPC instead.', old.id
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$function$;

create or replace function public.accounting_delete_single_line_entry(
  p_entry_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_role text;
  v_entry public.entries%rowtype;
  v_journal public.journals%rowtype;
  v_movement public.cash_bank_transactions%rowtype;
  v_lines_snapshot jsonb := '[]'::jsonb;
begin
  v_role := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', 'viewer');

  if v_role not in ('admin', 'super_admin') then
    raise exception 'Only administrators can accounting-delete journal entries'
      using errcode = '42501';
  end if;

  if length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A deletion reason of at least 5 characters is required'
      using errcode = '23514';
  end if;

  select entry.*
  into v_entry
  from public.entries entry
  where entry.id = p_entry_id
  for update;

  if v_entry.id is null then
    raise exception 'Entry not found'
      using errcode = '23503';
  end if;

  select journal.*
  into v_journal
  from public.journals journal
  where journal.source_type = 'single_line_entry'
    and journal.source_id = p_entry_id
  for update;

  if v_journal.id is null then
    raise exception 'The entry has no linked journal'
      using errcode = '23503';
  end if;

  if v_journal.reversal_of_id is not null
    or v_journal.status = 'reversed'
    or exists (
      select 1
      from public.journals reversal
      where reversal.reversal_of_id = v_journal.id
    ) then
    raise exception 'Reversed entries cannot be accounting-deleted'
      using errcode = '23514';
  end if;

  select movement.*
  into v_movement
  from public.cash_bank_transactions movement
  where movement.journal_id = v_journal.id
  for update;

  if v_movement.id is not null
    and exists (
      select 1
      from public.cash_bank_transactions reversal
      where reversal.reversal_of_transaction_id = v_movement.id
    ) then
    raise exception 'A reversed cash/bank movement cannot be accounting-deleted'
      using errcode = '23514';
  end if;

  select coalesce(jsonb_agg(to_jsonb(line) order by line.line_number), '[]'::jsonb)
  into v_lines_snapshot
  from public.journal_lines line
  where line.journal_id = v_journal.id;

  insert into public.journal_force_delete_audit (
    entry_id,
    journal_id,
    deleted_by,
    reason,
    entry_snapshot,
    journal_snapshot,
    lines_snapshot,
    cash_bank_transaction_snapshot,
    deletion_kind
  )
  values (
    p_entry_id,
    v_journal.id,
    (select auth.uid()),
    btrim(p_reason),
    to_jsonb(v_entry),
    to_jsonb(v_journal),
    v_lines_snapshot,
    case when v_movement.id is null then null else to_jsonb(v_movement) end,
    'accounting_delete'
  );

  perform set_config('app.force_delete_journal', 'on', true);
  perform set_config('app.accounting_delete_cash_bank', 'on', true);

  if v_movement.id is not null then
    delete from public.cash_bank_transactions
    where id = v_movement.id;
  end if;

  delete from public.journal_lines
  where journal_id = v_journal.id;

  delete from public.journals
  where id = v_journal.id;

  delete from public.entries
  where id = p_entry_id;
end;
$function$;

revoke execute on function public.force_delete_single_line_entry(uuid, text)
  from authenticated;

revoke all on function public.accounting_delete_single_line_entry(uuid, text)
  from public;
revoke execute on function public.accounting_delete_single_line_entry(uuid, text)
  from anon;
grant execute on function public.accounting_delete_single_line_entry(uuid, text)
  to authenticated;

comment on function public.accounting_delete_single_line_entry(uuid, text) is
  'Atomically removes an erroneous single-line entry and linked operational movement while preserving full audit snapshots.';

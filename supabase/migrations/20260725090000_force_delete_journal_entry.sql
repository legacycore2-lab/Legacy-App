-- Legacy Core ERP
-- Audited permanent deletion for exceptional admin-only corrections.

create table if not exists public.journal_force_delete_audit (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null,
  journal_id uuid,
  deleted_by uuid,
  deleted_at timestamptz not null default now(),
  reason text not null,
  entry_snapshot jsonb not null,
  journal_snapshot jsonb,
  lines_snapshot jsonb not null default '[]'::jsonb
);

alter table public.journal_force_delete_audit enable row level security;

create index if not exists journal_force_delete_audit_entry_id_idx
  on public.journal_force_delete_audit (entry_id);

create index if not exists journal_force_delete_audit_deleted_at_idx
  on public.journal_force_delete_audit (deleted_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'journal_force_delete_audit'
      and policyname = 'journal_force_delete_audit_select_admin'
  ) then
    create policy journal_force_delete_audit_select_admin
      on public.journal_force_delete_audit
      for select
      to authenticated
      using (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'super_admin')
      );
  end if;
end;
$$;

create or replace function public.protect_posted_journal_lines()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  target_journal_id uuid;
  target_status text;
begin
  -- Only the audited SECURITY DEFINER force-delete RPC sets this transaction-local flag.
  if current_setting('app.force_delete_journal', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_journal_id := old.journal_id;
  else
    target_journal_id := new.journal_id;
  end if;

  select status
  into target_status
  from public.journals
  where id = target_journal_id;

  if target_status in ('posted', 'reversed') then
    raise exception 'Lines of posted or reversed journals are immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;

create or replace function public.force_delete_single_line_entry(
  p_entry_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_role text;
  v_entry_snapshot jsonb;
  v_journal_id uuid;
  v_journal_snapshot jsonb;
  v_lines_snapshot jsonb;
begin
  v_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer');

  if v_role not in ('admin', 'super_admin') then
    raise exception 'Only administrators can permanently delete journal entries'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A deletion reason of at least 5 characters is required'
      using errcode = '23514';
  end if;

  select to_jsonb(e)
  into v_entry_snapshot
  from public.entries e
  where e.id = p_entry_id
  for update;

  if v_entry_snapshot is null then
    raise exception 'Entry not found'
      using errcode = '23503';
  end if;

  select j.id, to_jsonb(j)
  into v_journal_id, v_journal_snapshot
  from public.journals j
  where j.source_type = 'single_line_entry'
    and j.source_id = p_entry_id
  for update;

  if v_journal_id is not null then
    select coalesce(jsonb_agg(to_jsonb(jl) order by jl.line_number), '[]'::jsonb)
    into v_lines_snapshot
    from public.journal_lines jl
    where jl.journal_id = v_journal_id;
  else
    v_lines_snapshot := '[]'::jsonb;
  end if;

  insert into public.journal_force_delete_audit (
    entry_id,
    journal_id,
    deleted_by,
    reason,
    entry_snapshot,
    journal_snapshot,
    lines_snapshot
  )
  values (
    p_entry_id,
    v_journal_id,
    auth.uid(),
    trim(p_reason),
    v_entry_snapshot,
    v_journal_snapshot,
    v_lines_snapshot
  );

  perform set_config('app.force_delete_journal', 'on', true);

  if v_journal_id is not null then
    delete from public.journal_lines
    where journal_id = v_journal_id;

    delete from public.journals
    where id = v_journal_id;
  end if;

  delete from public.entries
  where id = p_entry_id;
end;
$function$;

revoke all on function public.force_delete_single_line_entry(uuid, text) from public;
revoke execute on function public.force_delete_single_line_entry(uuid, text) from anon;
grant execute on function public.force_delete_single_line_entry(uuid, text) to authenticated;

revoke all on public.journal_force_delete_audit from anon;
revoke insert, update, delete on public.journal_force_delete_audit from authenticated;
grant select on public.journal_force_delete_audit to authenticated;

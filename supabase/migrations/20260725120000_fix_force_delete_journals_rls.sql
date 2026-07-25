-- Legacy Core ERP
-- Fix: allow force_delete_single_line_entry RPC to delete posted/reversed journals.
--
-- Root cause
-- ----------
-- public.journals has RLS enabled but no DELETE policy, so every DELETE is
-- blocked by the implicit "deny" default — even inside a SECURITY DEFINER
-- function — because Supabase runs SECURITY DEFINER functions as the calling
-- user's role for RLS purposes unless the function owner has BYPASSRLS.
--
-- Fix strategy
-- ------------
-- 1. Add a narrow DELETE policy on public.journals that opens only when the
--    transaction-scoped flag app.force_delete_journal = 'on' is set.
--    That flag is set exclusively inside force_delete_single_line_entry (which
--    is SECURITY DEFINER and checks admin/super_admin before setting it).
-- 2. Add the matching bypass check to protect_posted_journal_header so a
--    future ALTER that widens its trigger events cannot silently block the
--    force-delete path.
-- 3. Nothing else changes: normal DELETE attempts (flag absent or 'off') are
--    still blocked by the missing/false policy — effectively a hard deny.

-- ---------------------------------------------------------------------------
-- 1. DELETE policy on public.journals
--    Allows deletion only when the force-delete flag is active in the current
--    transaction.  Because current_setting is evaluated per-row, and the flag
--    is set inside the SECURITY DEFINER RPC before the DELETE, it is 'on'
--    exactly when needed and reverts at transaction end.
-- ---------------------------------------------------------------------------

drop policy if exists journals_force_delete on public.journals;

create policy journals_force_delete
  on public.journals
  for delete
  to authenticated
  using (
    current_setting('app.force_delete_journal', true) = 'on'
    and
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'super_admin')
  );

-- ---------------------------------------------------------------------------
-- 2. Harden protect_posted_journal_header to handle DELETE events explicitly.
--    The existing trigger fires on UPDATE only, so this is currently a no-op
--    for DELETE.  We widen it defensively and add the bypass guard so the
--    function stays correct if someone later changes the trigger events.
-- ---------------------------------------------------------------------------

create or replace function public.protect_posted_journal_header()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  -- Allow force-delete path initiated by the audited admin RPC.
  if current_setting('app.force_delete_journal', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  -- Block DELETE of posted/reversed journals.
  if tg_op = 'DELETE' then
    if old.status in ('posted', 'reversed') then
      raise exception 'Posted or reversed journals cannot be deleted'
        using errcode = '23514';
    end if;
    return old;
  end if;

  -- UPDATE path: block field changes on immutable journals.
  if old.status in ('posted', 'reversed') then
    if new.journal_number  is distinct from old.journal_number
    or new.journal_code    is distinct from old.journal_code
    or new.journal_date    is distinct from old.journal_date
    or new.description     is distinct from old.description
    or new.project_id      is distinct from old.project_id
    or new.source_type     is distinct from old.source_type
    or new.source_id       is distinct from old.source_id
    or new.reversal_of_id  is distinct from old.reversal_of_id then
      raise exception 'Posted or reversed journal headers are immutable'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

-- Re-create the trigger to also fire on DELETE so the function above is
-- actually invoked for delete attempts in the future.
drop trigger if exists journals_protect_posted_header on public.journals;
create trigger journals_protect_posted_header
  before update or delete on public.journals
  for each row execute function public.protect_posted_journal_header();

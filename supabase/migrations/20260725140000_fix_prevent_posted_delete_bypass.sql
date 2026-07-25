-- Legacy Core ERP
-- Fix: add force-delete bypass to prevent_posted_journal_delete trigger function.
--
-- Root cause
-- ----------
-- prevent_posted_journal_delete() was created directly in the database (not
-- via a migration) and has no bypass guard for the force-delete path.
-- It unconditionally raises an exception when deleting posted/reversed journals,
-- blocking the audited admin RPC even after the RLS and
-- protect_posted_journal_header fixes.
--
-- Fix
-- ---
-- Add the same app.force_delete_journal bypass that exists in
-- protect_posted_journal_lines and protect_posted_journal_header.
-- Normal deletes (flag absent) are still blocked unconditionally.

create or replace function public.prevent_posted_journal_delete()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  -- Allow the audited admin force-delete RPC to proceed.
  if current_setting('app.force_delete_journal', true) = 'on' then
    return old;
  end if;

  if old.status in ('posted', 'reversed') then
    raise exception 'Posted or reversed journals cannot be deleted';
  end if;

  return old;
end;
$function$;

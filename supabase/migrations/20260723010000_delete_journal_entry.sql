-- Legacy Core ERP
-- Allow admin role to delete journal entries and their linked journals.
-- journal_lines cascade-delete automatically when the journal is deleted.
-- Uses 'if not exists' guard via drop-then-create to stay idempotent.

alter table public.entries  enable row level security;
alter table public.journals enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'entries'
      and policyname = 'entries_delete_admin'
  ) then
    execute $p$
      create policy entries_delete_admin
        on public.entries
        for delete
        to authenticated
        using (
          coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') = 'admin'
        )
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'journals'
      and policyname = 'journals_delete_admin'
  ) then
    execute $p$
      create policy journals_delete_admin
        on public.journals
        for delete
        to authenticated
        using (
          coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') = 'admin'
        )
    $p$;
  end if;
end $$;

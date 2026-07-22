do $migration$
declare
  target_table text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Required publication supabase_realtime was not found';
  end if;

  foreach target_table in array array['entries', 'accounts', 'projects']
  loop
    if to_regclass(format('public.%I', target_table)) is null then
      raise exception 'Required realtime table public.% was not found', target_table;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end
$migration$;

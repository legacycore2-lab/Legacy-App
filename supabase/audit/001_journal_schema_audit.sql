-- Legacy Core ERP
-- Read-only database audit for Journal Engine planning.
-- SAFE: This script contains SELECT statements only.
-- It does not create, alter, update, delete, truncate, grant, revoke, or drop anything.

-- 1) Public tables and RLS status
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_total_relation_size(c.oid) as total_size_bytes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 2) Columns, types, defaults, and nullability
select
  cols.table_name,
  cols.ordinal_position,
  cols.column_name,
  cols.data_type,
  cols.udt_name,
  cols.is_nullable,
  cols.column_default,
  cols.character_maximum_length,
  cols.numeric_precision,
  cols.numeric_scale
from information_schema.columns cols
where cols.table_schema = 'public'
order by cols.table_name, cols.ordinal_position;

-- 3) Primary keys, unique constraints, foreign keys, and checks
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as referenced_table_name,
  ccu.column_name as referenced_column_name,
  rc.update_rule,
  rc.delete_rule
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.constraint_schema = kcu.constraint_schema
left join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
 and tc.constraint_schema = ccu.constraint_schema
left join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name
 and tc.constraint_schema = rc.constraint_schema
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

-- 4) Indexes
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 5) Triggers
select
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name, event_manipulation;

-- 6) RLS policies
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 7) Public views
select
  table_name as view_name,
  view_definition
from information_schema.views
where table_schema = 'public'
order by table_name;

-- 8) Public functions used by the application/database
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result_type,
  l.lanname as language,
  p.prosecdef as security_definer,
  p.provolatile as volatility
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
order by p.proname, arguments;

-- 9) Sequences and ownership
select
  sequence_schema,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment,
  cycle_option
from information_schema.sequences
where sequence_schema = 'public'
order by sequence_name;

-- 10) Journal-focused data health summary (only when tables exist)
do $$
begin
  if to_regclass('public.projects') is not null then
    raise notice 'projects table exists';
  else
    raise notice 'projects table is missing';
  end if;

  if to_regclass('public.entries') is not null then
    raise notice 'entries table exists';
  else
    raise notice 'entries table is missing';
  end if;

  if to_regclass('public.project_access') is not null then
    raise notice 'project_access table exists';
  else
    raise notice 'project_access table is missing';
  end if;
end $$;

-- 11) Row counts for public tables (estimated, no full table scan)
select
  schemaname,
  relname as table_name,
  n_live_tup as estimated_live_rows,
  n_dead_tup as estimated_dead_rows,
  last_analyze,
  last_autoanalyze
from pg_stat_user_tables
where schemaname = 'public'
order by relname;

-- 12) Storage buckets metadata (read-only)
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by name;

create table if not exists public.system_settings_audit (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null, changed_keys text[] not null default '{}', previous_settings jsonb not null,
  new_settings jsonb not null, created_at timestamptz not null default now()
);
alter table public.system_settings_audit enable row level security;
revoke all on public.system_settings_audit from anon;
grant select on public.system_settings_audit to authenticated;
create policy system_settings_audit_admin_read on public.system_settings_audit for select to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin'));

create or replace function public.update_system_settings(p_settings jsonb) returns void language plpgsql security definer set search_path=public as $$
declare v_previous jsonb; v_actor text; v_keys text[];
begin
  if coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') not in ('super_admin','admin') then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_settings is null or jsonb_typeof(p_settings)<>'object' then raise exception 'Settings payload must be an object' using errcode='22023'; end if;
  select settings into v_previous from public.system_settings where id='default' for update;
  v_previous:=coalesce(v_previous,'{}'::jsonb); v_actor:=coalesce((select auth.jwt())->'user_metadata'->>'full_name','مدير النظام');
  select coalesce(array_agg(key order by key),'{}') into v_keys from (select key from jsonb_object_keys(v_previous||p_settings) key where v_previous->key is distinct from p_settings->key) changed;
  insert into public.system_settings(id,settings,updated_at,updated_by,updated_by_name) values('default',p_settings,now(),(select auth.uid()),v_actor)
  on conflict(id) do update set settings=excluded.settings,updated_at=excluded.updated_at,updated_by=excluded.updated_by,updated_by_name=excluded.updated_by_name;
  perform setval(
    'public.entries_number_seq'::regclass,
    greatest(coalesce((p_settings ->> 'nextJournalNumber')::bigint, 1), coalesce((select max(entry_number) + 1 from public.entries), 1)),
    false
  );
  perform setval(
    'public.advances_number_seq'::regclass,
    greatest(coalesce((p_settings ->> 'nextAdvanceNumber')::bigint, 1), coalesce((select max(advance_number) + 1 from public.advances), 1)),
    false
  );
  perform setval(
    'public.projects_number_seq'::regclass,
    greatest(
      coalesce((p_settings ->> 'nextProjectNumber')::bigint, 1),
      (select last_value + case when is_called then 1 else 0 end from public.projects_number_seq)
    ),
    false
  );
  if cardinality(v_keys)>0 then insert into public.system_settings_audit(actor_id,actor_name,changed_keys,previous_settings,new_settings) values((select auth.uid()),v_actor,v_keys,v_previous,p_settings); end if;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('company-assets','company-assets',true,2097152,array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy company_assets_public_read on storage.objects for select using(bucket_id='company-assets');
create policy company_assets_admin_insert on storage.objects for insert to authenticated with check(bucket_id='company-assets' and coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin'));
create policy company_assets_admin_update on storage.objects for update to authenticated using(bucket_id='company-assets' and coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin'));

create or replace function public.apply_configured_project_numbering() returns trigger language plpgsql security definer set search_path=public as $$
declare v_settings jsonb; v_prefix text;
begin
  select settings into v_settings from public.system_settings where id='default';
  if nullif(btrim(new.code),'') is null then v_prefix:=coalesce(v_settings->>'projectPrefix','PRJ'); new.code:=v_prefix||'-'||lpad(nextval('public.projects_number_seq')::text,5,'0'); end if;
  return new;
end $$;
create or replace function public.apply_configured_entry_numbering() returns trigger language plpgsql security definer set search_path=public as $$
declare v_settings jsonb; v_prefix text;
begin
  select settings into v_settings from public.system_settings where id='default';
  if nullif(btrim(new.entry_code),'') is null then v_prefix:=coalesce(v_settings->>'journalPrefix','JE'); new.entry_code:=v_prefix||'-'||lpad(new.entry_number::text,6,'0'); end if;
  return new;
end $$;
create sequence if not exists public.projects_number_seq start 1;
alter table public.entries add column if not exists entry_code text;
update public.entries
set entry_code = coalesce(
  nullif((select settings ->> 'journalPrefix' from public.system_settings where id = 'default'), ''),
  'JE'
) || '-' || lpad(entry_number::text, 6, '0')
where entry_code is null or btrim(entry_code) = '';
create unique index if not exists entries_entry_code_unique on public.entries(entry_code);
drop trigger if exists projects_configured_number on public.projects;
create trigger projects_configured_number before insert on public.projects for each row execute function public.apply_configured_project_numbering();
drop trigger if exists entries_configured_number on public.entries;
create trigger entries_configured_number before insert on public.entries for each row execute function public.apply_configured_entry_numbering();

create or replace view public.advances_overview
with (security_invoker = true)
as
select
  a.id,
  a.advance_number,
  a.holder_name,
  a.holder_title,
  a.issue_date,
  a.due_date,
  a.purpose,
  a.amount,
  a.spent_amount,
  a.returned_amount,
  coalesce(array_agg(p.name order by p.name) filter (where p.id is not null), array[]::text[]) as project_names,
  coalesce(nullif(settings.settings ->> 'advancePrefix', ''), 'ADV') || '-' || lpad(a.advance_number::text, 4, '0') as advance_code
from public.advances a
left join public.advance_projects ap on ap.advance_id = a.id
left join public.projects p on p.id = ap.project_id
left join public.system_settings settings on settings.id = 'default'
group by a.id, settings.settings;

revoke all on public.advances_overview from anon;
grant select on public.advances_overview to authenticated;

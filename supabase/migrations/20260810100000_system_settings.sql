create table if not exists public.system_settings (
  id text primary key default 'default' check (id='default'), settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by_name text
);
alter table public.system_settings enable row level security;
revoke all on public.system_settings from anon;
grant select on public.system_settings to authenticated;
create policy system_settings_select_authenticated on public.system_settings for select to authenticated using (true);
insert into public.system_settings(id,settings,updated_by_name) values('default','{"country":"EG","currency":"EGP","language":"ar","timezone":"Africa/Cairo","systemNameAr":"ليجاسي كور","systemNameEn":"LEGACY CORE","fiscalYearStartMonth":1,"vatEnabled":true,"vatRate":14,"pricesIncludeVat":false,"journalPrefix":"JE","projectPrefix":"PRJ","advancePrefix":"ADV","nextJournalNumber":1,"nextProjectNumber":1,"nextAdvanceNumber":1,"emailNotifications":true,"overdueAdvanceNotifications":true,"dailySummary":false,"sessionTimeoutMinutes":60,"requireStrongPasswords":true}'::jsonb,'مدير النظام') on conflict(id) do nothing;

create or replace function public.update_system_settings(p_settings jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
  if coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') not in ('super_admin','admin') then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_settings is null or jsonb_typeof(p_settings)<>'object' then raise exception 'Settings payload must be an object' using errcode='22023'; end if;
  insert into public.system_settings(id,settings,updated_at,updated_by,updated_by_name) values('default',p_settings,now(),(select auth.uid()),coalesce((select auth.jwt())->'user_metadata'->>'full_name','مدير النظام'))
  on conflict(id) do update set settings=excluded.settings,updated_at=excluded.updated_at,updated_by=excluded.updated_by,updated_by_name=excluded.updated_by_name;
end $$;
revoke all on function public.update_system_settings(jsonb) from public;
grant execute on function public.update_system_settings(jsonb) to authenticated;

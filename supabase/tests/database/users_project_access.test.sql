begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

select has_table('public', 'user_project_access', 'user project access table exists');
select has_table('public', 'user_admin_audit', 'user administration audit table exists');

insert into auth.users (id, email, raw_app_meta_data)
values (
  '81000000-0000-0000-0000-000000000001',
  'project-access@example.com',
  '{"role":"viewer"}'::jsonb
);

insert into public.projects (id, name)
values
  ('82000000-0000-0000-0000-000000000001', 'Assigned project'),
  ('82000000-0000-0000-0000-000000000002', 'Hidden project');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"81000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"viewer"}}',
  true
);

select is((select count(*) from public.projects), 2::bigint, 'unconfigured users keep legacy project access');

reset role;
insert into public.user_project_access_scope (user_id, restricted)
values ('81000000-0000-0000-0000-000000000001', true);
insert into public.user_project_access (user_id, project_id)
values (
  '81000000-0000-0000-0000-000000000001',
  '82000000-0000-0000-0000-000000000001'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"81000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"viewer"}}',
  true
);

select is((select count(*) from public.projects), 1::bigint, 'configured users see assigned projects only');

select * from finish();
rollback;

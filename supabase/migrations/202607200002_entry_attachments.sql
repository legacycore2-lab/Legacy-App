-- Private invoice and document attachments for journal entries.
-- Run after 20260720_0001_auth_rbac.sql.

begin;

-- PostgREST needs access to the sequence when an authenticated user inserts an entry.
revoke all on sequence public.entries_number_seq from anon;
grant usage, select on sequence public.entries_number_seq to authenticated;

create table if not exists public.entry_attachments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  sort_order smallint not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  constraint entry_attachments_mime_type_check check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  ),
  constraint entry_attachments_size_check check (
    size_bytes > 0 and size_bytes <= 10485760
  ),
  constraint entry_attachments_sort_order_check check (sort_order >= 0),
  constraint entry_attachments_storage_path_check check (
    storage_path like 'entries/%' and storage_path not like '%..%'
  )
);

create index if not exists entry_attachments_entry_id_idx
  on public.entry_attachments (entry_id);

create index if not exists entry_attachments_created_at_idx
  on public.entry_attachments (created_at desc);

alter table public.entry_attachments enable row level security;

revoke all on table public.entry_attachments from anon;
grant select, insert, delete on table public.entry_attachments to authenticated;

drop policy if exists entry_attachments_select_finance on public.entry_attachments;
drop policy if exists entry_attachments_insert_finance on public.entry_attachments;
drop policy if exists entry_attachments_delete_finance on public.entry_attachments;

create policy entry_attachments_select_finance
on public.entry_attachments
for select
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy entry_attachments_insert_finance
on public.entry_attachments
for insert
to authenticated
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
  and created_by = auth.uid()
);

create policy entry_attachments_delete_finance
on public.entry_attachments
for delete
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

-- A private bucket keeps invoices inaccessible without an authenticated RLS-approved request.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'entry-attachments',
  'entry-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists entry_attachments_objects_select_finance on storage.objects;
drop policy if exists entry_attachments_objects_insert_finance on storage.objects;
drop policy if exists entry_attachments_objects_update_finance on storage.objects;
drop policy if exists entry_attachments_objects_delete_finance on storage.objects;

create policy entry_attachments_objects_select_finance
on storage.objects
for select
to authenticated
using (
  bucket_id = 'entry-attachments'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy entry_attachments_objects_insert_finance
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'entry-attachments'
  and (storage.foldername(name))[1] = 'entries'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
  and exists (
    select 1
    from public.entries
    where id::text = (storage.foldername(name))[2]
  )
);

create policy entry_attachments_objects_update_finance
on storage.objects
for update
to authenticated
using (
  bucket_id = 'entry-attachments'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
)
with check (
  bucket_id = 'entry-attachments'
  and (storage.foldername(name))[1] = 'entries'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

create policy entry_attachments_objects_delete_finance
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'entry-attachments'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
);

commit;

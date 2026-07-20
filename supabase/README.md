# Supabase security setup

The application reads roles from the signed `app_metadata.role` claim. Supported values are:

- `admin`
- `accountant`
- `viewer`

## Apply database protection

Run the migrations in `supabase/migrations` in filename order through the Supabase SQL Editor or Supabase CLI before adding real data:

1. `20260720_0001_auth_rbac.sql` removes anonymous access to `projects` and `entries`, enables RLS, and installs the policies used by the frontend permission map.
2. `20260720_0002_entry_attachments.sql` adds private journal attachments, a private Storage bucket, a 10 MB per-file limit, and support for JPEG, PNG, WebP, and PDF files.

Attachment objects must use this path format so the Storage policy can validate the journal entry:

```text
entries/<entry-id>/<unique-file-name>
```

Run each migration once. Both files are safe to retry if the SQL Editor disconnects after completion.

## Promote the first administrator

After creating the first account in Authentication → Users, run this statement in the SQL Editor with the correct email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'replace-with-admin-email@example.com';
```

Sign out and sign in again after changing a role so Supabase issues a JWT containing the new claim.

Never put a secret or service-role key in Vite, GitHub Pages, or browser code.

# Supabase security setup

The application reads roles from the signed `app_metadata.role` claim. Supported values are:

- `admin`
- `accountant`
- `viewer`

## Apply database protection

Run the migrations in `supabase/migrations` through the Supabase SQL Editor or Supabase CLI before adding real data. The RBAC migration removes anonymous access to `projects` and `entries`, enables RLS, and installs the policies used by the frontend permission map.

## Promote the first administrator

After creating the first account in Authentication → Users, run this statement in the SQL Editor with the correct email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'replace-with-admin-email@example.com';
```

Sign out and sign in again after changing a role so Supabase issues a JWT containing the new claim.

Never put a secret or service-role key in Vite, GitHub Pages, or browser code.

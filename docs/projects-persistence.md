# Projects persistence rollout

## Order of operations

1. Review and apply
   `supabase/migrations/20260721090000_expand_projects.sql` to the target
   Supabase project.
2. Verify that existing project rows still load successfully.
3. Deploy the application code from this pull request.
4. Create a test project and confirm that it appears immediately in the
   projects list.

## Safety notes

- The migration does not delete or rename existing columns.
- Legacy date columns are not converted. New dates are stored as ISO text to
  remain compatible with existing data.
- Project creation follows
  `Page → Hook → Service → Mapper → Repository → Supabase`.
- The projects query is invalidated after a successful insert so the new
  project appears without a page reload.

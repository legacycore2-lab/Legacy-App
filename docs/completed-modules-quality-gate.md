# Completed Modules Quality Gate

This checklist defines what “100%” means for a module that is considered complete. It does not claim that the entire ERP product is complete.

## Required gates

- No UI access to repositories or Supabase.
- Dependency flow remains `UI -> Hook -> Service -> Repository -> Supabase`.
- No unused TypeScript locals or parameters.
- No known orphaned production files in the completed module.
- No duplicated business rules across UI, hooks, services, and repositories.
- User-facing failures are mapped to stable application errors.
- Loading, empty, success, and error states are handled.
- Existing behavior is protected by focused tests.
- `npm run quality` passes before merge.

## Scope of this hardening branch

- Authentication
- Journal
- Shared application infrastructure used by completed modules

Mock-backed and placeholder modules are outside this score until their implementation is complete.

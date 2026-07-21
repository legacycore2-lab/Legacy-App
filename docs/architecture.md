# Legacy Core Architecture

## Golden rule

All application data access must follow this direction:

`Page / Component â†’ Hook â†’ Service â†’ Repository â†’ Supabase`

The chain describes ownership of data access. Pages may compose UI components, and all layers may use shared domain types, but no layer may skip a data-access boundary.

## Layer responsibilities

- **Page / Component:** rendering, user interaction, and composition only. It consumes Hooks and domain-facing view models.
- **Hook:** React state, React Query orchestration, and translating UI events into Service calls.
- **Service:** business rules, validation, calculations, and domain mapping. It must not import the Supabase SDK or client.
- **Repository:** persistence queries and conversion between database records and Service-facing data.
- **Infrastructure:** creation and configuration of the Supabase client. It contains no feature business rules.

Database records stay inside Repositories. UI contracts and domain types belong in each feature's `types` directory.

## Feature layout

```text
src/features/<feature>/
  pages/
  components/
  hooks/
  services/
  repositories/
  types/
  styles/
```

Features must not import another feature's internal files. Shared code must be promoted deliberately to `src/shared` with a stable, domain-neutral contract.

## Enforcement

- `npm run architecture:check` scans production TypeScript sources.
- `npm run architecture:test` verifies allowed and forbidden dependency fixtures.
- `npm run quality` runs formatting, linting, architecture contracts, unit tests, and the production build.

Any new syntax supported by the guard must include a contract fixture before the guard is changed.

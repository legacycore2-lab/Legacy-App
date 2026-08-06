# Architecture & Dead Code Audit v2

Status: In progress

## Scope

- Golden chain: Page → Hook → Service → Repository → Supabase
- Dead/orphan files and unused exports
- Circular dependencies
- Cross-feature coupling
- Duplicate helpers and formatters
- God files and mixed responsibilities
- Route reachability and stale re-exports

## Safety constraints

- No UI behavior changes
- No business logic changes
- No SQL, RLS, migration, or Supabase schema changes
- Delete only items proven unused

## Audit automation added

- `scripts/check-dependency-graph.mjs`
- Scans runtime TypeScript/TSX files from `src/main.tsx`
- Reports source files that are not reachable from the application entrypoint
- Fails CI when a circular dependency is detected
- Excludes tests, specs, and declaration files
- Uses no new package dependency

## Findings

Awaiting the dependency-graph output from CI before any deletion.

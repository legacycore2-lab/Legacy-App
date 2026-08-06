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

## Findings

Pending.

# Architecture & Dead Code Audit v2

Status: Cleanup applied — awaiting final CI confirmation

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

## Baseline findings

- Architecture boundaries: 202 source files passed
- Dependency graph: 199 runtime source files scanned
- Reachable from `src/main.tsx`: 195
- Circular dependencies: none
- Orphan candidates: 4

Confirmed runtime orphans:

1. `src/features/reports/components/ReportsTabs.tsx`
   - Superseded by the Reports Center navigation and not imported by runtime code.
2. `src/features/reports/components/TopProjectsPanel.tsx`
   - Superseded by the current executive dashboard and not imported by runtime code.
3. `src/features/reports/hooks/useReports.ts`
   - Legacy compatibility re-export only; no runtime consumer remains.
4. `src/features/reports/services/contractor-statement-pdf.service.ts`
   - Superseded by `buildContractorStatement()` + `contractor-statement-renderer.service` in `useReportExport`.
   - Its dedicated test file was removed with the dead API because it tested only that superseded service.

## Cleanup applied

Deleted:

- `src/features/reports/components/ReportsTabs.tsx`
- `src/features/reports/components/TopProjectsPanel.tsx`
- `src/features/reports/hooks/useReports.ts`
- `src/features/reports/services/contractor-statement-pdf.service.ts`
- `src/features/reports/services/contractor-statement-pdf.service.test.ts`

No business logic, UI behavior, database, SQL, RLS, or migrations were changed.

## Final acceptance

Pending a fresh full quality run after deletion:

- Format
- Lint
- Architecture contract tests
- Architecture boundaries
- Dependency graph
- Unit tests
- E2E smoke tests
- Production build

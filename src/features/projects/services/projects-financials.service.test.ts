import { describe, expect, it } from 'vitest'
import {
  buildProjectFinancialTotals,
  mergeProjectsWithFinancialTotals,
  normalizeFinancialEntryType,
  parseFinancialAmount,
} from './projects.service'
import type { FinancialEntryRow } from '../repositories/projects.repository'
import type { Project } from '../types/project.types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function row(overrides: Partial<FinancialEntryRow>): FinancialEntryRow {
  return {
    project_id: 'proj-1',
    entry_type: 'expense',
    amount: 1000,
    entry_number: 1,
    ...overrides,
  }
}

function project(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    code: '',
    name: `مشروع ${id}`,
    client: '',
    location: '',
    manager: '',
    status: 'active',
    progress: 0,
    contractValue: 0,
    received: 999, // static column — must be overridden to 0 if no entries
    spent: 999, // static column — must be overridden to 0 if no entries
    startDate: '',
    endDate: '',
    notes: '',
    ...overrides,
  }
}

// ─── Repository pagination contract ──────────────────────────────────────────
// findAllProjectFinancialEntries() uses .order('entry_number', { ascending: true })
// before .range(from, to). This guarantees stable, deterministic ordering across
// all pages — without it, the DB may return rows in arbitrary order, causing
// duplicates or missing rows at page boundaries.
//
// entry_number is a sequential surrogate key (bigint sequence) on the entries
// table and is the correct stable key for pagination. It is fetched in
// FinancialEntryRow but is intentionally excluded from all financial calculations
// (buildProjectFinancialTotals does not read it).
//
// Integration test of the pagination loop itself requires a live Supabase
// connection and is out of scope for unit tests. The pure aggregation logic
// (buildProjectFinancialTotals, mergeProjectsWithFinancialTotals) is fully
// covered below — it is agnostic to how many pages the repository fetched.

// ─── normalizeFinancialEntryType ──────────────────────────────────────────────

describe('normalizeFinancialEntryType', () => {
  it('returns income for "income"', () => expect(normalizeFinancialEntryType('income')).toBe('income'))
  it('returns income for "i"', () => expect(normalizeFinancialEntryType('i')).toBe('income'))
  it('returns expense for "expense"', () => expect(normalizeFinancialEntryType('expense')).toBe('expense'))
  it('returns expense for "e"', () => expect(normalizeFinancialEntryType('e')).toBe('expense'))
  it('returns null for unknown', () => expect(normalizeFinancialEntryType('debit')).toBeNull())
  it('returns null for null', () => expect(normalizeFinancialEntryType(null)).toBeNull())
  it('is case-insensitive', () => expect(normalizeFinancialEntryType('INCOME')).toBe('income'))
})

// ─── parseFinancialAmount ─────────────────────────────────────────────────────

describe('parseFinancialAmount', () => {
  it('parses valid number', () => expect(parseFinancialAmount(5000)).toBe(5000))
  it('parses numeric string', () => expect(parseFinancialAmount('3000')).toBe(3000))
  it('returns 0 for negative', () => expect(parseFinancialAmount(-100)).toBe(0))
  it('returns 0 for null', () => expect(parseFinancialAmount(null)).toBe(0))
  it('returns 0 for NaN string', () => expect(parseFinancialAmount('abc')).toBe(0))
  it('returns 0 for Infinity', () => expect(parseFinancialAmount(Infinity)).toBe(0))
})

// ─── buildProjectFinancialTotals ──────────────────────────────────────────────

describe('buildProjectFinancialTotals', () => {
  it('returns empty map for empty rows', () => {
    expect(buildProjectFinancialTotals([])).toEqual(new Map())
  })

  it('تاج سلطان: expense 15,000 + 1,000 = 16,000', () => {
    const rows = [
      row({ project_id: 'taj', entry_type: 'expense', amount: 15000 }),
      row({ project_id: 'taj', entry_type: 'expense', amount: 1000 }),
    ]
    const totals = buildProjectFinancialTotals(rows)
    expect(totals.get('taj')?.spent).toBe(16000)
    expect(totals.get('taj')?.received).toBe(0)
  })

  it('income and expense in the same project', () => {
    const rows = [row({ entry_type: 'income', amount: 20000 }), row({ entry_type: 'expense', amount: 8000 })]
    const totals = buildProjectFinancialTotals(rows)
    expect(totals.get('proj-1')?.received).toBe(20000)
    expect(totals.get('proj-1')?.spent).toBe(8000)
  })

  it('multiple projects are aggregated independently', () => {
    const rows = [
      row({ project_id: 'p1', entry_type: 'expense', amount: 5000 }),
      row({ project_id: 'p2', entry_type: 'income', amount: 3000 }),
    ]
    const totals = buildProjectFinancialTotals(rows)
    expect(totals.get('p1')?.spent).toBe(5000)
    expect(totals.get('p2')?.received).toBe(3000)
    expect(totals.get('p1')?.received).toBe(0)
    expect(totals.get('p2')?.spent).toBe(0)
  })

  it('"i" shorthand counted as income', () => {
    const rows = [row({ entry_type: 'i', amount: 7000 })]
    expect(buildProjectFinancialTotals(rows).get('proj-1')?.received).toBe(7000)
  })

  it('"e" shorthand counted as expense', () => {
    const rows = [row({ entry_type: 'e', amount: 4000 })]
    expect(buildProjectFinancialTotals(rows).get('proj-1')?.spent).toBe(4000)
  })

  it('unknown entry_type is ignored — not added to any total', () => {
    const rows = [row({ entry_type: 'debit', amount: 9999 })]
    expect(buildProjectFinancialTotals(rows).get('proj-1')).toBeUndefined()
  })

  it('invalid amount is ignored', () => {
    const rows = [row({ entry_type: 'expense', amount: 'bad' })]
    expect(buildProjectFinancialTotals(rows).get('proj-1')).toBeUndefined()
  })

  it('negative amount is ignored', () => {
    const rows = [row({ entry_type: 'expense', amount: -500 })]
    expect(buildProjectFinancialTotals(rows).get('proj-1')).toBeUndefined()
  })

  it('does not mutate input array', () => {
    const rows = [row({})]
    const original = [...rows]
    buildProjectFinancialTotals(rows)
    expect(rows).toEqual(original)
  })
})

// ─── mergeProjectsWithFinancialTotals ─────────────────────────────────────────

describe('mergeProjectsWithFinancialTotals', () => {
  it('project without entries gets received=0, spent=0 — NOT static column value', () => {
    const projects = [project('p-no-entries')]
    const totals = new Map() // no entries for this project
    const merged = mergeProjectsWithFinancialTotals(projects, totals)
    // static columns were 999/999 — must be overridden to 0
    expect(merged[0].received).toBe(0)
    expect(merged[0].spent).toBe(0)
  })

  it('project with entries gets correct totals, not static columns', () => {
    const projects = [project('p1')]
    const totals = new Map([['p1', { received: 12000, spent: 5000 }]])
    const merged = mergeProjectsWithFinancialTotals(projects, totals)
    expect(merged[0].received).toBe(12000)
    expect(merged[0].spent).toBe(5000)
  })

  it('does not mutate input projects array', () => {
    const projects = [project('p1')]
    const original = JSON.stringify(projects)
    mergeProjectsWithFinancialTotals(projects, new Map())
    expect(JSON.stringify(projects)).toBe(original)
  })

  it('does not mutate individual project objects', () => {
    const p = project('p1')
    const originalReceived = p.received
    mergeProjectsWithFinancialTotals([p], new Map([['p1', { received: 99, spent: 99 }]]))
    expect(p.received).toBe(originalReceived)
  })

  it('handles multiple projects correctly', () => {
    const projects = [project('p1'), project('p2'), project('p3')]
    const totals = new Map([
      ['p1', { received: 10000, spent: 3000 }],
      ['p3', { received: 500, spent: 200 }],
    ])
    const merged = mergeProjectsWithFinancialTotals(projects, totals)
    expect(merged[0].received).toBe(10000)
    expect(merged[1].received).toBe(0) // p2 has no entries
    expect(merged[1].spent).toBe(0) // not static 999
    expect(merged[2].received).toBe(500)
  })
})

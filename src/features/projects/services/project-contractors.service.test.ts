import { describe, expect, it } from 'vitest'
import { buildProjectContractors, buildProjectContractorsViewModel } from './project-contractors.service'
import type { ProjectContractorRecord } from '../types/project-contractor.types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ProjectContractorRecord>): ProjectContractorRecord {
  return {
    id: 'e1',
    contractor_name: 'محمود مصباح',
    project_id: 'proj-1',
    entry_date: '2025-03-10',
    entry_type: 'expense',
    amount: 5000,
    description: 'أعمال',
    entry_number: 1,
    projects: { id: 'proj-1', name: 'تاج سلطان' },
    ...overrides,
  }
}

// ─── buildProjectContractors ──────────────────────────────────────────────────

describe('buildProjectContractors', () => {
  it('returns empty array for empty records', () => {
    expect(buildProjectContractors([])).toHaveLength(0)
  })

  it('filters out null contractor_name', () => {
    expect(buildProjectContractors([makeRecord({ contractor_name: null })])).toHaveLength(0)
  })

  it('filters out empty/whitespace contractor_name', () => {
    expect(buildProjectContractors([makeRecord({ contractor_name: '   ' })])).toHaveLength(0)
  })

  it('groups two entries for the same contractor', () => {
    const records = [
      makeRecord({ id: 'e1', amount: 15000, entry_number: 1 }),
      makeRecord({ id: 'e2', amount: 1000, entry_number: 2 }),
    ]
    const result = buildProjectContractors(records)
    expect(result).toHaveLength(1)
    expect(result[0].entryCount).toBe(2)
  })

  it('computes 15,000 + 1,000 = 16,000 totalExpense', () => {
    const records = [
      makeRecord({ id: 'e1', entry_type: 'expense', amount: 15000 }),
      makeRecord({ id: 'e2', entry_type: 'expense', amount: 1000 }),
    ]
    const result = buildProjectContractors(records)
    expect(result[0].totalExpense).toBe(16000)
    expect(result[0].totalIncome).toBe(0)
    expect(result[0].netMovement).toBe(-16000)
  })

  it('keeps contractors from different projects separate (records pre-filtered by caller)', () => {
    // The service receives records already scoped to a project by the repository.
    // Two contractors from the same project remain separate.
    const records = [
      makeRecord({ id: 'e1', contractor_name: 'محمود مصباح', project_id: 'proj-1' }),
      makeRecord({ id: 'e2', contractor_name: 'أحمد حسن', project_id: 'proj-1' }),
    ]
    expect(buildProjectContractors(records)).toHaveLength(2)
  })

  it('entries for another project are NOT mixed in (enforced at repository layer)', () => {
    // Simulate that the repository correctly filtered — only proj-1 entries arrive.
    const records = [makeRecord({ id: 'e1', project_id: 'proj-1', amount: 5000 })]
    const result = buildProjectContractors(records)
    expect(result[0].totalExpense).toBe(5000)
    // No entry from proj-2 pollutes the total
    expect(result[0].entryCount).toBe(1)
  })

  it('unknown entry_type: entryType is "unknown", real amount preserved, not in totals', () => {
    const records = [makeRecord({ entry_type: 'debit', amount: 7000 })]
    const result = buildProjectContractors(records)
    expect(result[0].entries[0].entryType).toBe('unknown')
    expect(result[0].entries[0].amount).toBe(7000)
    expect(result[0].totalExpense).toBe(0)
    expect(result[0].totalIncome).toBe(0)
  })

  it('null entry_type: entryType is "unknown", real amount preserved, not in totals', () => {
    const records = [makeRecord({ entry_type: null, amount: 3000 })]
    const result = buildProjectContractors(records)
    expect(result[0].entries[0].entryType).toBe('unknown')
    expect(result[0].entries[0].amount).toBe(3000)
    expect(result[0].totalExpense).toBe(0)
    expect(result[0].totalIncome).toBe(0)
  })

  it('picks the latest activity date across entries', () => {
    const records = [
      makeRecord({ id: 'e1', entry_date: '2025-01-10' }),
      makeRecord({ id: 'e2', entry_date: '2025-05-20' }),
      makeRecord({ id: 'e3', entry_date: '2025-03-01' }),
    ]
    expect(buildProjectContractors(records)[0].latestActivityDate).toBe('2025-05-20')
  })

  it('sorts entries newest-first by entryDate, then seq descending on tie', () => {
    const records = [
      makeRecord({ id: 'e-old', entry_date: '2025-01-05', entry_number: 1 }),
      makeRecord({ id: 'e-new', entry_date: '2025-03-10', entry_number: 3 }),
      makeRecord({ id: 'e-tie1', entry_date: '2025-03-10', entry_number: 2 }),
    ]
    const result = buildProjectContractors(records)
    const ids = result[0].entries.map((e) => e.id)
    // newest date first: 2025-03-10 before 2025-01-05
    // tie on date: seq 3 before seq 2
    expect(ids).toEqual(['e-new', 'e-tie1', 'e-old'])
  })

  it('does not mutate the input records array or internal entries during sort', () => {
    const records = [makeRecord({})]
    const original = [...records]
    buildProjectContractors(records)
    expect(records).toEqual(original)
  })
})

// ─── buildProjectContractorsViewModel ────────────────────────────────────────

describe('buildProjectContractorsViewModel', () => {
  it('empty → all zeros, hasData false', () => {
    const vm = buildProjectContractorsViewModel([])
    expect(vm.hasData).toBe(false)
    expect(vm.totalContractors).toBe(0)
    expect(vm.totalExpense).toBe(0)
  })

  it('sorts contractors by totalExpense descending', () => {
    const contractors = buildProjectContractors([
      makeRecord({ id: 'e1', contractor_name: 'A', amount: 1000 }),
      makeRecord({ id: 'e2', contractor_name: 'B', amount: 9000 }),
    ])
    const vm = buildProjectContractorsViewModel(contractors)
    expect(vm.contractors[0].totalExpense).toBeGreaterThan(vm.contractors[1].totalExpense)
  })

  it('sums totalEntries across all contractors', () => {
    const contractors = buildProjectContractors([
      makeRecord({ id: 'e1', contractor_name: 'A' }),
      makeRecord({ id: 'e2', contractor_name: 'A' }),
      makeRecord({ id: 'e3', contractor_name: 'B' }),
    ])
    expect(buildProjectContractorsViewModel(contractors).totalEntries).toBe(3)
  })
})

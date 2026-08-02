import { describe, expect, it } from 'vitest'
import {
  buildContractorKey,
  buildContractors,
  buildContractorsViewModel,
  extractSelectedContractor,
  normaliseName,
  normalizeEntryType,
  parseAmount,
  searchContractors,
  sortContractors,
} from './contractors.service'
import type { ContractorEntryRecord } from '../types/contractor.types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ContractorEntryRecord>): ContractorEntryRecord {
  return {
    id: 'e1',
    contractor_name: 'محمد علي',
    project_id: 'p1',
    entry_date: '2025-03-10',
    entry_type: 'expense',
    amount: 5000,
    description: 'أعمال بناء',
    entry_number: 1,
    projects: { id: 'p1', name: 'مشروع أ' },
    ...overrides,
  }
}

// ─── normaliseName ────────────────────────────────────────────────────────────

describe('normaliseName', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normaliseName('  أحمد  ')).toBe('أحمد')
  })

  it('collapses repeated internal spaces', () => {
    expect(normaliseName('محمد   علي')).toBe('محمد علي')
  })

  it('handles single spaces correctly', () => {
    expect(normaliseName('Ahmed Hassan')).toBe('Ahmed Hassan')
  })
})

// ─── buildContractorKey ───────────────────────────────────────────────────────

describe('buildContractorKey', () => {
  it('lowercases Latin characters', () => {
    expect(buildContractorKey('ABC Corp')).toBe('abc corp')
  })

  it('preserves Arabic characters unchanged', () => {
    expect(buildContractorKey('محمد علي')).toBe('محمد علي')
  })

  it('mixed Arabic + Latin lowercases only Latin part', () => {
    expect(buildContractorKey('شركة ABC')).toBe('شركة abc')
  })
})

// ─── parseAmount ──────────────────────────────────────────────────────────────

describe('parseAmount', () => {
  it('parses a number directly', () => {
    expect(parseAmount(1234)).toBe(1234)
  })

  it('parses a numeric string', () => {
    expect(parseAmount('5000')).toBe(5000)
  })

  it('returns 0 for null', () => {
    expect(parseAmount(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(parseAmount(undefined)).toBe(0)
  })

  it('returns 0 for non-numeric string', () => {
    expect(parseAmount('abc')).toBe(0)
  })

  it('returns 0 for NaN', () => {
    expect(parseAmount(NaN)).toBe(0)
  })

  it('returns 0 for negative amount', () => {
    expect(parseAmount(-100)).toBe(0)
  })

  it('returns 0 for Infinity', () => {
    expect(parseAmount(Infinity)).toBe(0)
  })
})

// ─── normalizeEntryType ──────────────────────────────────────────────────────

describe('normalizeEntryType', () => {
  it('returns income for "income"', () => {
    expect(normalizeEntryType('income')).toBe('income')
  })

  it('returns income for "i" (shorthand)', () => {
    expect(normalizeEntryType('i')).toBe('income')
  })

  it('returns expense for "expense"', () => {
    expect(normalizeEntryType('expense')).toBe('expense')
  })

  it('returns expense for "e" (shorthand)', () => {
    expect(normalizeEntryType('e')).toBe('expense')
  })

  it('returns null for unknown value — never silently treated as expense', () => {
    expect(normalizeEntryType('unknown')).toBeNull()
    expect(normalizeEntryType('debit')).toBeNull()
    expect(normalizeEntryType('credit')).toBeNull()
  })

  it('returns null for null', () => {
    expect(normalizeEntryType(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(normalizeEntryType('')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(normalizeEntryType('INCOME')).toBe('income')
    expect(normalizeEntryType('EXPENSE')).toBe('expense')
    expect(normalizeEntryType('I')).toBe('income')
    expect(normalizeEntryType('E')).toBe('expense')
  })
})

// ─── buildContractors ─────────────────────────────────────────────────────────

describe('buildContractors', () => {
  it('returns empty array for empty records', () => {
    expect(buildContractors([])).toHaveLength(0)
  })

  it('skips null contractor_name', () => {
    const records = [makeRecord({ contractor_name: null })]
    expect(buildContractors(records)).toHaveLength(0)
  })

  it('skips empty string contractor_name', () => {
    const records = [makeRecord({ contractor_name: '' })]
    expect(buildContractors(records)).toHaveLength(0)
  })

  it('skips whitespace-only contractor_name', () => {
    const records = [makeRecord({ contractor_name: '   ' })]
    expect(buildContractors(records)).toHaveLength(0)
  })

  it('trims and deduplicates English names case-insensitively', () => {
    const records = [
      makeRecord({ id: 'e1', contractor_name: 'Ahmed Ali', amount: 1000 }),
      makeRecord({ id: 'e2', contractor_name: 'ahmed ali', amount: 2000 }),
      makeRecord({ id: 'e3', contractor_name: '  AHMED ALI  ', amount: 500 }),
    ]
    const result = buildContractors(records)
    expect(result).toHaveLength(1)
    expect(result[0].entryCount).toBe(3)
    expect(result[0].totalExpense).toBe(3500)
  })

  it('does not merge two different Arabic names', () => {
    const records = [
      makeRecord({ id: 'e1', contractor_name: 'محمد علي' }),
      makeRecord({ id: 'e2', contractor_name: 'أحمد حسن' }),
    ]
    expect(buildContractors(records)).toHaveLength(2)
  })

  it('correctly counts unique projects', () => {
    const records = [
      makeRecord({ id: 'e1', project_id: 'p1', projects: { id: 'p1', name: 'A' } }),
      makeRecord({ id: 'e2', project_id: 'p2', projects: { id: 'p2', name: 'B' } }),
      makeRecord({ id: 'e3', project_id: 'p1', projects: { id: 'p1', name: 'A' } }),
    ]
    const result = buildContractors(records)
    expect(result[0].projectCount).toBe(2)
  })

  it('correctly counts entries', () => {
    const records = [makeRecord({ id: 'e1' }), makeRecord({ id: 'e2' }), makeRecord({ id: 'e3' })]
    expect(buildContractors(records)[0].entryCount).toBe(3)
  })

  it('sums income and expense correctly', () => {
    const records = [
      makeRecord({ id: 'e1', entry_type: 'income', amount: 3000 }),
      makeRecord({ id: 'e2', entry_type: 'expense', amount: 1000 }),
      makeRecord({ id: 'e3', entry_type: 'expense', amount: 500 }),
    ]
    const result = buildContractors(records)
    expect(result[0].totalIncome).toBe(3000)
    expect(result[0].totalExpense).toBe(1500)
    expect(result[0].netMovement).toBe(1500)
  })

  it('picks the latest activity date', () => {
    const records = [
      makeRecord({ id: 'e1', entry_date: '2025-01-10' }),
      makeRecord({ id: 'e2', entry_date: '2025-03-20' }),
      makeRecord({ id: 'e3', entry_date: '2025-02-05' }),
    ]
    expect(buildContractors(records)[0].latestActivityDate).toBe('2025-03-20')
  })

  it('treats invalid amount as 0', () => {
    const records = [makeRecord({ amount: 'bad' as unknown as number })]
    const result = buildContractors(records)
    expect(result[0].totalExpense).toBe(0)
    expect(result[0].entryCount).toBe(1)
  })

  it('"i" entry_type is counted as income', () => {
    const records = [makeRecord({ entry_type: 'i', amount: 1000 })]
    const result = buildContractors(records)
    expect(result[0].totalIncome).toBe(1000)
    expect(result[0].totalExpense).toBe(0)
  })

  it('"e" entry_type is counted as expense', () => {
    const records = [makeRecord({ entry_type: 'e', amount: 800 })]
    const result = buildContractors(records)
    expect(result[0].totalExpense).toBe(800)
    expect(result[0].totalIncome).toBe(0)
  })

  it('unknown entry_type is NOT counted as expense — amount excluded from totals', () => {
    const records = [makeRecord({ entry_type: 'debit', amount: 5000 })]
    const result = buildContractors(records)
    expect(result[0].totalExpense).toBe(0)
    expect(result[0].totalIncome).toBe(0)
    // The entry is still included in the list (documented) but with zeroed amount
    expect(result[0].entryCount).toBe(1)
  })

  it('null entry_type is NOT counted in any total', () => {
    const records = [makeRecord({ entry_type: null, amount: 3000 })]
    const result = buildContractors(records)
    expect(result[0].totalExpense).toBe(0)
    expect(result[0].totalIncome).toBe(0)
    expect(result[0].entryCount).toBe(1)
  })

  it('does not mutate the input array', () => {
    const records = [makeRecord({})]
    const original = [...records]
    buildContractors(records)
    expect(records).toEqual(original)
  })
})

// ─── searchContractors ────────────────────────────────────────────────────────

describe('searchContractors', () => {
  const contractors = buildContractors([
    makeRecord({ id: 'e1', contractor_name: 'Ahmed Ali', project_id: 'p1' }),
    makeRecord({ id: 'e2', contractor_name: 'محمد حسن', project_id: 'p1' }),
  ])

  it('empty query returns all', () => {
    expect(searchContractors(contractors, '')).toHaveLength(2)
  })

  it('finds English contractor case-insensitively', () => {
    expect(searchContractors(contractors, 'ahmed')).toHaveLength(1)
    expect(searchContractors(contractors, 'AHMED')).toHaveLength(1)
    expect(searchContractors(contractors, 'Ahmed Ali')).toHaveLength(1)
  })

  it('finds Arabic contractor', () => {
    expect(searchContractors(contractors, 'محمد')).toHaveLength(1)
  })

  it('returns empty for no match', () => {
    expect(searchContractors(contractors, 'xyz')).toHaveLength(0)
  })

  it('does not mutate input array', () => {
    const original = [...contractors]
    searchContractors(contractors, 'ahmed')
    expect(contractors).toEqual(original)
  })
})

// ─── sortContractors ──────────────────────────────────────────────────────────

describe('sortContractors', () => {
  const base = buildContractors([
    makeRecord({ id: 'e1', contractor_name: 'ز شركة', amount: 100, entry_date: '2025-01-01' }),
    makeRecord({ id: 'e2', contractor_name: 'أ شركة', amount: 5000, entry_date: '2025-03-01' }),
    makeRecord({ id: 'e3', contractor_name: 'م شركة', amount: 500, entry_date: '2025-02-01' }),
  ])

  it('sort by name uses Arabic locale', () => {
    const sorted = sortContractors(base, 'name')
    // Just verifies it runs without error and returns same length
    expect(sorted).toHaveLength(3)
  })

  it('sort by expense — highest first', () => {
    const sorted = sortContractors(base, 'expense')
    expect(sorted[0].totalExpense).toBeGreaterThanOrEqual(sorted[1].totalExpense)
    expect(sorted[1].totalExpense).toBeGreaterThanOrEqual(sorted[2].totalExpense)
  })

  it('sort by entries — most first', () => {
    const multi = buildContractors([
      makeRecord({ id: 'e1', contractor_name: 'A' }),
      makeRecord({ id: 'e2', contractor_name: 'A' }),
      makeRecord({ id: 'e3', contractor_name: 'B' }),
    ])
    const sorted = sortContractors(multi, 'entries')
    expect(sorted[0].entryCount).toBeGreaterThanOrEqual(sorted[1].entryCount)
  })

  it('sort by latest — most recent first', () => {
    const sorted = sortContractors(base, 'latest')
    expect(sorted[0].latestActivityDate >= sorted[1].latestActivityDate).toBe(true)
  })

  it('does not mutate input array', () => {
    const original = [...base]
    sortContractors(base, 'expense')
    expect(base).toEqual(original)
  })
})

// ─── buildContractorsViewModel ────────────────────────────────────────────────

describe('buildContractorsViewModel', () => {
  it('empty contractors → all zeros', () => {
    const vm = buildContractorsViewModel([])
    expect(vm.totalContractors).toBe(0)
    expect(vm.totalExpense).toBe(0)
    expect(vm.totalProjects).toBe(0)
    expect(vm.totalEntries).toBe(0)
  })

  it('counts unique projects across contractors', () => {
    const contractors = buildContractors([
      makeRecord({ id: 'e1', contractor_name: 'A', project_id: 'p1', projects: { id: 'p1', name: 'X' } }),
      makeRecord({ id: 'e2', contractor_name: 'B', project_id: 'p1', projects: { id: 'p1', name: 'X' } }),
    ])
    // Two contractors both linked to the same project → 1 unique project
    expect(buildContractorsViewModel(contractors).totalProjects).toBe(1)
  })
})
// ─── extractSelectedContractor ───────────────────────────────────────────────

describe('extractSelectedContractor', () => {
  const contractors = buildContractors([
    makeRecord({ id: 'e1', contractor_name: 'Ahmed Ali' }),
    makeRecord({ id: 'e2', contractor_name: 'محمد حسن' }),
  ])

  it('returns the matching contractor by key', () => {
    const result = extractSelectedContractor(contractors, 'ahmed ali')
    expect(result).not.toBeNull()
    expect(result?.name).toBe('Ahmed Ali')
  })

  it('returns null when key is not found (e.g. after refetch or search change)', () => {
    expect(extractSelectedContractor(contractors, 'non-existent-key')).toBeNull()
  })

  it('returns null when selectedKey is null', () => {
    expect(extractSelectedContractor(contractors, null)).toBeNull()
  })

  it('returns null when contractors list is empty', () => {
    expect(extractSelectedContractor([], 'ahmed ali')).toBeNull()
  })

  it('auto-hides panel when search query filters out the selected contractor', () => {
    // Simulate: user selected Ahmed Ali, then searches for "محمد"
    const filteredAfterSearch = searchContractors(contractors, 'محمد')
    // Ahmed Ali is no longer in the filtered list
    const result = extractSelectedContractor(filteredAfterSearch, 'ahmed ali')
    expect(result).toBeNull()
  })
})

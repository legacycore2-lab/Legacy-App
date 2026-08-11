import { describe, expect, it } from 'vitest'
import { filterContractorEntries, getContractorEntriesPage } from './contractors.service'
import type { Contractor, ContractorEntry } from '../types/contractor.types'

const entries: ContractorEntry[] = Array.from({ length: 45 }, (_, index) => ({
  id: `e-${index + 1}`,
  entryDate: index < 15 ? '2026-08-10' : index < 30 ? '2026-07-10' : '2026-06-10',
  entryType: 'expense' as const,
  amount: (index + 1) * 100,
  description: `قيد ${index + 1}`,
  seq: 45 - index,
  projectId: index % 2 === 0 ? 'p1' : 'p2',
  projectName: index % 2 === 0 ? 'مشروع 1' : 'مشروع 2',
}))

const contractor: Contractor = {
  name: 'مقاول الاختبار',
  key: 'مقاول الاختبار',
  entryCount: entries.length,
  projectCount: 2,
  totalIncome: 0,
  totalExpense: entries.reduce((sum, entry) => sum + entry.amount, 0),
  netMovement: -entries.reduce((sum, entry) => sum + entry.amount, 0),
  latestActivityDate: '2026-08-10',
  projects: [
    { id: 'p1', name: 'مشروع 1' },
    { id: 'p2', name: 'مشروع 2' },
  ],
  entries,
}

const noFilters = { projectId: '', dateFrom: '', dateTo: '' }

describe('filterContractorEntries', () => {
  it('returns all entries without filters', () => {
    expect(filterContractorEntries(entries, noFilters)).toHaveLength(45)
  })

  it('filters by project', () => {
    const result = filterContractorEntries(entries, { ...noFilters, projectId: 'p1' })
    expect(result).toHaveLength(23)
    expect(result.every((entry) => entry.projectId === 'p1')).toBe(true)
  })

  it('filters by date from', () => {
    const result = filterContractorEntries(entries, { ...noFilters, dateFrom: '2026-07-01' })
    expect(result).toHaveLength(30)
  })

  it('filters by date to', () => {
    const result = filterContractorEntries(entries, { ...noFilters, dateTo: '2026-06-30' })
    expect(result).toHaveLength(15)
  })

  it('combines project and date range filters', () => {
    const result = filterContractorEntries(entries, {
      projectId: 'p2',
      dateFrom: '2026-07-01',
      dateTo: '2026-08-31',
    })
    expect(result).toHaveLength(15)
    expect(result.every((entry) => entry.projectId === 'p2')).toBe(true)
  })
})

describe('getContractorEntriesPage', () => {
  it('returns 20 entries on page 1', () => {
    const result = getContractorEntriesPage(contractor, noFilters, 1)
    expect(result.entries).toHaveLength(20)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(3)
    expect(result.totalCount).toBe(45)
  })

  it('returns the final partial page', () => {
    const result = getContractorEntriesPage(contractor, noFilters, 3)
    expect(result.entries).toHaveLength(5)
    expect(result.page).toBe(3)
  })

  it('clamps page above total pages', () => {
    const result = getContractorEntriesPage(contractor, noFilters, 99)
    expect(result.page).toBe(3)
    expect(result.entries).toHaveLength(5)
  })

  it('respects filters before pagination', () => {
    const result = getContractorEntriesPage(contractor, { ...noFilters, projectId: 'p1' }, 1)
    expect(result.totalCount).toBe(23)
    expect(result.totalPages).toBe(2)
    expect(result.entries).toHaveLength(20)
  })

  it('clamps page size to 100', () => {
    const result = getContractorEntriesPage(contractor, noFilters, 1, 500)
    expect(result.pageSize).toBe(100)
    expect(result.entries).toHaveLength(45)
  })
})

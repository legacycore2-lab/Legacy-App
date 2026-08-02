import { describe, expect, it } from 'vitest'
import { buildProjectJournalViewModel } from './projects.service'
import type { ProjectDetails, ProjectEntry } from '../types/project.types'

function makeEntry(overrides: Partial<ProjectEntry>): ProjectEntry {
  return {
    id: 'entry-1',
    seq: 1,
    entryDate: '2026-01-01',
    type: 'income',
    category: 'دفعة عميل',
    description: 'دفعة مقدمة',
    contractor: '',
    paymentMethod: 'تحويل بنكي',
    amount: 1000,
    ...overrides,
  }
}

function makeDetails(entries: ProjectEntry[]): ProjectDetails {
  const totalIncome = entries
    .filter((entry) => entry.type === 'income')
    .reduce((total, entry) => total + entry.amount, 0)
  const totalExpense = entries
    .filter((entry) => entry.type === 'expense')
    .reduce((total, entry) => total + entry.amount, 0)

  return {
    project: {
      id: 'project-1',
      code: 'P-001',
      name: 'مشروع اختبار',
      client: 'عميل اختبار',
      location: 'القاهرة',
      manager: 'مدير المشروع',
      status: 'active',
      progress: 20,
      contractValue: 100000,
      received: totalIncome,
      spent: totalExpense,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      notes: '',
    },
    entries,
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      entryCount: entries.length,
    },
    analytics: {
      recentEntries: [],
      expenseCategories: [],
    },
  }
}

describe('buildProjectJournalViewModel', () => {
  it('returns an empty state for a project without entries', () => {
    const viewModel = buildProjectJournalViewModel(makeDetails([]))

    expect(viewModel.entries).toEqual([])
    expect(viewModel.hasEntries).toBe(false)
    expect(viewModel.summary.entryCount).toBe(0)
  })

  it('keeps the financial summary from project details', () => {
    const entries = [
      makeEntry({ id: 'income', type: 'income', amount: 5000 }),
      makeEntry({ id: 'expense', type: 'expense', amount: 1250 }),
    ]

    const viewModel = buildProjectJournalViewModel(makeDetails(entries))

    expect(viewModel.summary).toEqual({
      totalIncome: 5000,
      totalExpense: 1250,
      balance: 3750,
      entryCount: 2,
    })
    expect(viewModel.hasEntries).toBe(true)
  })

  it('sorts entries by date from newest to oldest', () => {
    const entries = [
      makeEntry({ id: 'old', entryDate: '2026-01-05', seq: 3 }),
      makeEntry({ id: 'new', entryDate: '2026-03-10', seq: 1 }),
      makeEntry({ id: 'middle', entryDate: '2026-02-01', seq: 2 }),
    ]

    const viewModel = buildProjectJournalViewModel(makeDetails(entries))

    expect(viewModel.entries.map((entry) => entry.id)).toEqual(['new', 'middle', 'old'])
  })

  it('uses sequence number as the tie-breaker for entries on the same date', () => {
    const entries = [
      makeEntry({ id: 'lower-seq', entryDate: '2026-03-10', seq: 10 }),
      makeEntry({ id: 'higher-seq', entryDate: '2026-03-10', seq: 12 }),
      makeEntry({ id: 'no-seq', entryDate: '2026-03-10', seq: null }),
    ]

    const viewModel = buildProjectJournalViewModel(makeDetails(entries))

    expect(viewModel.entries.map((entry) => entry.id)).toEqual(['higher-seq', 'lower-seq', 'no-seq'])
  })

  it('does not mutate the original entries array', () => {
    const entries = [
      makeEntry({ id: 'old', entryDate: '2026-01-01' }),
      makeEntry({ id: 'new', entryDate: '2026-02-01' }),
    ]
    const originalOrder = entries.map((entry) => entry.id)

    buildProjectJournalViewModel(makeDetails(entries))

    expect(entries.map((entry) => entry.id)).toEqual(originalOrder)
  })
})

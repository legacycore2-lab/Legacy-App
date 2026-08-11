import { describe, expect, it } from 'vitest'
import type { JournalDetailsRecord } from '../repositories/journal.repository'
import type { JournalEntry } from '../types/journal.types'
import { mapJournalDetails } from './journal.mapper'
import { normalizeJournalDateRange, summarizeJournalPage } from './journal.service'

const entries: JournalEntry[] = [
  {
    id: 'income',
    sequence: 1,
    entryDate: '2026-07-20',
    projectName: 'مشروع',
    type: 'income',
    category: 'دفعة',
    description: 'دفعة عميل',
    contractor: '',
    paymentMethod: 'تحويل',
    amount: 1500,
  },
  {
    id: 'expense',
    sequence: 2,
    entryDate: '2026-07-20',
    projectName: 'مشروع',
    type: 'expense',
    category: 'خامات',
    description: 'شراء خامات',
    contractor: '',
    paymentMethod: 'نقدي',
    amount: 400,
  },
]

describe('summarizeJournalPage', () => {
  it('keeps financial calculations outside the component layer', () => {
    expect(summarizeJournalPage(entries, 42)).toEqual({
      totalCount: 42,
      pageIncome: 1500,
      pageExpense: 400,
      pageNet: 1100,
    })
  })
})

describe('normalizeJournalDateRange', () => {
  it('keeps a valid date range unchanged', () => {
    expect(normalizeJournalDateRange('2026-07-01', '2026-07-31')).toEqual({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    })
  })

  it('swaps an inverted date range', () => {
    expect(normalizeJournalDateRange('2026-07-31', '2026-07-01')).toEqual({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    })
  })

  it('supports an open-ended range', () => {
    expect(normalizeJournalDateRange('', '2026-07-31')).toEqual({
      dateFrom: '',
      dateTo: '2026-07-31',
    })
  })
})

describe('mapJournalDetails', () => {
  it('maps and totals the debit and credit lines', () => {
    const record: JournalDetailsRecord = {
      id: 'journal-id',
      journal_number: 12,
      journal_date: '2026-07-22',
      description: 'دفعة عميل',
      status: 'posted',
      created_at: '2026-07-22T10:00:00Z',
      posted_at: '2026-07-22T10:00:01Z',
      project: { name: 'مشروع تجريبي' },
      lines: [
        {
          id: 'debit',
          line_number: 1,
          description: null,
          debit: '5000',
          credit: 0,
          account: { code: '1111', name_ar: 'البنك الأهلي' },
        },
        {
          id: 'credit',
          line_number: 2,
          description: null,
          debit: 0,
          credit: '5000',
          account: { code: '4100', name_ar: 'إيرادات عامة' },
        },
      ],
    }

    expect(mapJournalDetails(record)).toMatchObject({
      journalNumber: 12,
      projectName: 'مشروع تجريبي',
      totalDebit: 5000,
      totalCredit: 5000,
    })
  })
})

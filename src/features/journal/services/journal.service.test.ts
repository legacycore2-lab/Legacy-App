import { describe, expect, it } from 'vitest'
import type { JournalEntry } from '../types/journal.types'
import { summarizeJournalPage } from './journal.service'

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

import { describe, expect, it } from 'vitest'
import type { JournalEntry } from '../types/journal.types'
import { filterJournalEntries } from './journal-filter.service'

const entries: JournalEntry[] = [
  {
    id: '1',
    sequence: 1,
    entryDate: '2026-07-20',
    projectName: 'هايد بارك',
    type: 'income',
    category: 'دفعات',
    description: 'دفعة عميل',
    contractor: '',
    paymentMethod: 'تحويل',
    amount: 1000,
  },
  {
    id: '2',
    sequence: 2,
    entryDate: '2026-07-20',
    projectName: 'العيادة',
    type: 'expense',
    category: 'كهرباء',
    description: 'شراء كابلات',
    contractor: 'أحمد',
    paymentMethod: 'نقدي',
    amount: 500,
  },
]

describe('filterJournalEntries', () => {
  it('filters by Arabic search text', () =>
    expect(filterJournalEntries(entries, { query: 'كابلات', type: 'all' })).toHaveLength(1))
  it('filters by type', () =>
    expect(filterJournalEntries(entries, { query: '', type: 'income' })).toEqual([entries[0]]))
})

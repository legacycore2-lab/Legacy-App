import { describe, expect, it } from 'vitest'
import type { JournalEntryRecord } from '../repositories/journal.repository'
import { mapJournalEntry } from './journal.mapper'

const base: JournalEntryRecord = {
  id: 'entry-1',
  seq: 12,
  entry_date: '2026-07-20',
  type: 'i',
  category: 'دفعة',
  description: 'دفعة عميل',
  contractor: null,
  payment_method: 'تحويل',
  amount: '1500',
  project: { name: 'هايد بارك' },
}

describe('mapJournalEntry', () => {
  it('maps valid legacy income records', () => {
    expect(mapJournalEntry(base)).toMatchObject({ type: 'income', amount: 1500, projectName: 'هايد بارك' })
  })

  it('maps legacy expense records', () => {
    expect(mapJournalEntry({ ...base, type: 'e' }).type).toBe('expense')
  })

  it('rejects unknown entry types', () => {
    expect(() => mapJournalEntry({ ...base, type: 'other' })).toThrow('نوع القيد غير صالح')
  })

  it('rejects invalid amounts', () => {
    expect(() => mapJournalEntry({ ...base, amount: 'invalid' })).toThrow('مبلغ القيد غير صالح')
  })
})

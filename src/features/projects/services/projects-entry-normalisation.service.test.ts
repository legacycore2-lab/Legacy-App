import { describe, expect, it } from 'vitest'
import type { ProjectEntryRecord } from '../repositories/projects.repository'
import { mapProjectEntry, summarizeEntries } from './projects.service'

function makeRecord(overrides: Partial<ProjectEntryRecord>): ProjectEntryRecord {
  return {
    id: 'e1',
    seq: 1,
    entry_date: '2025-03-10',
    entry_type: 'expense',
    category: 'عمالة',
    description: 'أعمال بناء',
    contractor_name: null,
    payment_method: 'cash',
    amount: 1000,
    is_reversal: false,
    ...overrides,
  }
}

describe('mapProjectEntry', () => {
  it('income entry maps to type "income"', () => {
    expect(mapProjectEntry(makeRecord({ entry_type: 'income' })).type).toBe('income')
  })

  it('expense entry maps to type "expense"', () => {
    expect(mapProjectEntry(makeRecord({ entry_type: 'expense' })).type).toBe('expense')
  })

  it('"i" shorthand maps to "income"', () => {
    expect(mapProjectEntry(makeRecord({ entry_type: 'i' })).type).toBe('income')
  })

  it('"e" shorthand maps to "expense"', () => {
    expect(mapProjectEntry(makeRecord({ entry_type: 'e' })).type).toBe('expense')
  })

  it('unknown entry_type maps to "unknown" — NOT "expense"', () => {
    expect(mapProjectEntry(makeRecord({ entry_type: 'debit' })).type).toBe('unknown')
  })

  it('null entry_type maps to "unknown"', () => {
    expect(mapProjectEntry(makeRecord({ entry_type: null })).type).toBe('unknown')
  })

  it('unknown entry preserves real amount', () => {
    expect(mapProjectEntry(makeRecord({ entry_type: 'debit', amount: 4567 })).amount).toBe(4567)
  })

  it('reversal entry maps to the opposite signed financial amount', () => {
    expect(mapProjectEntry(makeRecord({ amount: 1500, is_reversal: true })).amount).toBe(-1500)
  })
})

describe('summarizeEntries', () => {
  it('تاج سلطان: 15000 + 1000 expense = totalExpense 16000', () => {
    const entries = [
      mapProjectEntry(makeRecord({ entry_type: 'expense', amount: 15000, id: 'e1' })),
      mapProjectEntry(makeRecord({ entry_type: 'expense', amount: 1000, id: 'e2' })),
    ]
    const s = summarizeEntries(entries)
    expect(s.totalExpense).toBe(16000)
    expect(s.totalIncome).toBe(0)
    expect(s.balance).toBe(-16000)
  })

  it('income + expense gives correct balance', () => {
    const entries = [
      mapProjectEntry(makeRecord({ entry_type: 'income', amount: 20000, id: 'e1' })),
      mapProjectEntry(makeRecord({ entry_type: 'expense', amount: 8000, id: 'e2' })),
    ]
    const s = summarizeEntries(entries)
    expect(s.balance).toBe(12000)
    expect(s.totalIncome).toBe(20000)
    expect(s.totalExpense).toBe(8000)
  })

  it('original expense plus reversal returns project impact to zero', () => {
    const entries = [
      mapProjectEntry(makeRecord({ entry_type: 'expense', amount: 1500, id: 'original' })),
      mapProjectEntry(
        makeRecord({ entry_type: 'expense', amount: 1500, id: 'reversal', is_reversal: true }),
      ),
    ]
    const s = summarizeEntries(entries)
    expect(s.totalExpense).toBe(0)
    expect(s.totalIncome).toBe(0)
    expect(s.balance).toBe(0)
  })

  it('unknown entry does NOT enter income, expense, or balance', () => {
    const entries = [mapProjectEntry(makeRecord({ entry_type: 'debit', amount: 9999 }))]
    const s = summarizeEntries(entries)
    expect(s.totalIncome).toBe(0)
    expect(s.totalExpense).toBe(0)
    expect(s.balance).toBe(0)
  })

  it('unknown does not shift balance when mixed with known entries', () => {
    const entries = [
      mapProjectEntry(makeRecord({ entry_type: 'income', amount: 10000, id: 'e1' })),
      mapProjectEntry(makeRecord({ entry_type: 'debit', amount: 5000, id: 'e2' })),
      mapProjectEntry(makeRecord({ entry_type: 'expense', amount: 2000, id: 'e3' })),
    ]
    expect(summarizeEntries(entries).balance).toBe(8000)
  })

  it('entryCount includes unknown entries', () => {
    const entries = [
      mapProjectEntry(makeRecord({ entry_type: 'income', id: 'e1' })),
      mapProjectEntry(makeRecord({ entry_type: 'debit', id: 'e2' })),
    ]
    expect(summarizeEntries(entries).entryCount).toBe(2)
  })

  it('does not mutate input array', () => {
    const entries = [mapProjectEntry(makeRecord({ entry_type: 'income', amount: 1000 }))]
    const original = JSON.stringify(entries)
    summarizeEntries(entries)
    expect(JSON.stringify(entries)).toBe(original)
  })
})

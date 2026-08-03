import { describe, expect, it } from 'vitest'
import { normalizeEntryType } from '../../../shared/contractors-helpers'

// ─── helpers that mirror mapProjectEntry + summarizeEntries ───────────────────

type EntryInput = {
  entry_type: string | null
  amount: number | string
}

type MappedEntry = {
  type: 'income' | 'expense' | 'unknown'
  amount: number
}

function mapEntry(record: EntryInput): MappedEntry {
  const amount = Number(record.amount)
  const normalised = normalizeEntryType(record.entry_type)
  return {
    type: normalised ?? 'unknown',
    amount: Number.isFinite(amount) ? amount : 0,
  }
}

function summarise(entries: MappedEntry[]) {
  let totalIncome = 0
  let totalExpense = 0
  let balance = 0
  for (const e of entries) {
    totalIncome += e.type === 'income' ? e.amount : 0
    totalExpense += e.type === 'expense' ? e.amount : 0
    balance += e.type === 'income' ? e.amount : e.type === 'expense' ? -e.amount : 0
  }
  return { totalIncome, totalExpense, balance, entryCount: entries.length }
}

describe('Project entry normalisation (mapProjectEntry + summarizeEntries behaviour)', () => {
  it('income entry adds to totalIncome and balance', () => {
    const entries = [mapEntry({ entry_type: 'income', amount: 5000 })]
    const s = summarise(entries)
    expect(s.totalIncome).toBe(5000)
    expect(s.balance).toBe(5000)
    expect(s.totalExpense).toBe(0)
  })

  it('expense entry adds to totalExpense and subtracts from balance', () => {
    const entries = [mapEntry({ entry_type: 'expense', amount: 3000 })]
    const s = summarise(entries)
    expect(s.totalExpense).toBe(3000)
    expect(s.balance).toBe(-3000)
    expect(s.totalIncome).toBe(0)
  })

  it('تاج سلطان: 15000 + 1000 expense = 16000 totalExpense, balance = -16000', () => {
    const entries = [
      mapEntry({ entry_type: 'expense', amount: 15000 }),
      mapEntry({ entry_type: 'expense', amount: 1000 }),
    ]
    const s = summarise(entries)
    expect(s.totalExpense).toBe(16000)
    expect(s.balance).toBe(-16000)
  })

  it('income + expense gives correct balance', () => {
    const entries = [
      mapEntry({ entry_type: 'income', amount: 20000 }),
      mapEntry({ entry_type: 'expense', amount: 8000 }),
    ]
    const s = summarise(entries)
    expect(s.balance).toBe(12000)
    expect(s.totalIncome).toBe(20000)
    expect(s.totalExpense).toBe(8000)
  })

  it('unknown entry_type maps to "unknown" — does NOT enter income/expense/balance', () => {
    const entry = mapEntry({ entry_type: 'debit', amount: 9999 })
    expect(entry.type).toBe('unknown')
    const s = summarise([entry])
    expect(s.totalIncome).toBe(0)
    expect(s.totalExpense).toBe(0)
    expect(s.balance).toBe(0)
  })

  it('unknown entry preserves real amount for display', () => {
    const entry = mapEntry({ entry_type: 'debit', amount: 4567 })
    expect(entry.amount).toBe(4567)
  })

  it('null entry_type maps to "unknown" — excluded from totals', () => {
    const entry = mapEntry({ entry_type: null, amount: 3000 })
    expect(entry.type).toBe('unknown')
    const s = summarise([entry])
    expect(s.balance).toBe(0)
  })

  it('unknown does not shift balance', () => {
    const entries = [
      mapEntry({ entry_type: 'income', amount: 10000 }),
      mapEntry({ entry_type: 'debit', amount: 5000 }),
      mapEntry({ entry_type: 'expense', amount: 2000 }),
    ]
    const s = summarise(entries)
    expect(s.balance).toBe(8000) // 10000 - 2000, debit excluded
  })

  it('entryCount includes unknown entries', () => {
    const entries = [
      mapEntry({ entry_type: 'income', amount: 100 }),
      mapEntry({ entry_type: 'debit', amount: 200 }),
    ]
    expect(summarise(entries).entryCount).toBe(2)
  })

  it('does not mutate input', () => {
    const entries = [
      mapEntry({ entry_type: 'income', amount: 1000 }),
      mapEntry({ entry_type: 'expense', amount: 500 }),
    ]
    const original = JSON.stringify(entries)
    summarise(entries)
    expect(JSON.stringify(entries)).toBe(original)
  })
})

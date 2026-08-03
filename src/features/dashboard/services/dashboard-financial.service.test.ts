import { describe, expect, it } from 'vitest'
import type { DashboardEntryRecord } from '../types/dashboard.types'

// ─── We test the internal logic by importing through the module ───────────────
// getDashboardData is async and calls Supabase, so we test pure helpers
// by extracting them. Since they're not exported, we replicate the logic
// under test here — this mirrors the architecture contract tests pattern.

// Instead, import normalizeEntryType from shared (what dashboard now uses):
import { normalizeEntryType } from '../../../shared/contractors-helpers'

function toAmount(value: number | string | null): number {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

function computeTotals(entries: Pick<DashboardEntryRecord, 'type' | 'amount'>[]) {
  let totalIncome = 0
  let totalExpense = 0
  for (const entry of entries) {
    const type = normalizeEntryType(entry.type)
    if (!type) continue
    const amount = toAmount(entry.amount)
    if (type === 'income') totalIncome += amount
    else totalExpense += amount
  }
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
}

function computeProjectBalance(
  entries: Pick<DashboardEntryRecord, 'type' | 'amount' | 'project_id'>[],
  projectId: string,
): number {
  let balance = 0
  for (const entry of entries) {
    if (entry.project_id !== projectId) continue
    const type = normalizeEntryType(entry.type)
    if (!type) continue
    const amount = toAmount(entry.amount)
    balance += type === 'income' ? amount : -amount
  }
  return balance
}

function makeEntry(overrides: Partial<DashboardEntryRecord>): DashboardEntryRecord {
  return {
    id: 'e1',
    project_id: 'p1',
    type: 'expense',
    amount: 1000,
    description: 'test',
    entry_date: '2025-01-01',
    seq: 1,
    ...overrides,
  }
}

describe('Dashboard financial calculations (via shared normalizeEntryType)', () => {
  it('income entry adds to totalIncome', () => {
    const { totalIncome, totalExpense } = computeTotals([makeEntry({ type: 'income', amount: 5000 })])
    expect(totalIncome).toBe(5000)
    expect(totalExpense).toBe(0)
  })

  it('expense entry adds to totalExpense', () => {
    const { totalIncome, totalExpense } = computeTotals([makeEntry({ type: 'expense', amount: 3000 })])
    expect(totalExpense).toBe(3000)
    expect(totalIncome).toBe(0)
  })

  it('"i" shorthand counts as income', () => {
    const { totalIncome } = computeTotals([makeEntry({ type: 'i', amount: 2000 })])
    expect(totalIncome).toBe(2000)
  })

  it('"e" shorthand counts as expense', () => {
    const { totalExpense } = computeTotals([makeEntry({ type: 'e', amount: 1500 })])
    expect(totalExpense).toBe(1500)
  })

  it('null entry_type does NOT enter any total', () => {
    const { totalIncome, totalExpense } = computeTotals([makeEntry({ type: null, amount: 9999 })])
    expect(totalIncome).toBe(0)
    expect(totalExpense).toBe(0)
  })

  it('unknown entry_type does NOT enter any total (not treated as expense)', () => {
    const { totalIncome, totalExpense } = computeTotals([makeEntry({ type: 'debit', amount: 7777 })])
    expect(totalIncome).toBe(0)
    expect(totalExpense).toBe(0)
  })

  it('invalid (NaN) amount contributes 0', () => {
    const { totalExpense } = computeTotals([
      makeEntry({ type: 'expense', amount: 'bad' as unknown as number }),
    ])
    expect(totalExpense).toBe(0)
  })

  it('negative amount contributes 0', () => {
    const { totalExpense } = computeTotals([makeEntry({ type: 'expense', amount: -500 })])
    expect(totalExpense).toBe(0)
  })

  it('balance = income - expense', () => {
    const entries = [
      makeEntry({ type: 'income', amount: 10000 }),
      makeEntry({ type: 'expense', amount: 4000 }),
    ]
    expect(computeTotals(entries).balance).toBe(6000)
  })

  it('unknown entry does not shift balance', () => {
    const entries = [
      makeEntry({ type: 'income', amount: 10000 }),
      makeEntry({ type: 'debit', amount: 5000 }), // unknown
    ]
    const { balance } = computeTotals(entries)
    expect(balance).toBe(10000) // unknown excluded
  })

  it('does not mutate input array', () => {
    const entries = [makeEntry({})]
    const original = [...entries]
    computeTotals(entries)
    expect(entries).toEqual(original)
  })

  it('project balance excludes unknown entry_type', () => {
    const entries = [
      makeEntry({ project_id: 'p1', type: 'income', amount: 8000 }),
      makeEntry({ project_id: 'p1', type: 'debit', amount: 3000 }),
    ]
    expect(computeProjectBalance(entries, 'p1')).toBe(8000)
  })
})

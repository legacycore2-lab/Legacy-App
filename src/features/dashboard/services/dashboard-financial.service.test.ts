import { describe, expect, it } from 'vitest'
import type { DashboardEntryRecord } from '../types/dashboard.types'
import { buildDashboardTotals, buildProjectBalances } from './dashboard.service'

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

describe('buildDashboardTotals', () => {
  it('income entry adds to totalIncome', () => {
    const { totalIncome, totalExpense } = buildDashboardTotals([makeEntry({ type: 'income', amount: 5000 })])
    expect(totalIncome).toBe(5000)
    expect(totalExpense).toBe(0)
  })

  it('expense entry adds to totalExpense', () => {
    const { totalIncome, totalExpense } = buildDashboardTotals([makeEntry({ type: 'expense', amount: 3000 })])
    expect(totalExpense).toBe(3000)
    expect(totalIncome).toBe(0)
  })

  it('"i" shorthand counts as income', () => {
    expect(buildDashboardTotals([makeEntry({ type: 'i', amount: 2000 })]).totalIncome).toBe(2000)
  })

  it('"e" shorthand counts as expense', () => {
    expect(buildDashboardTotals([makeEntry({ type: 'e', amount: 1500 })]).totalExpense).toBe(1500)
  })

  it('null entry_type does NOT enter any total', () => {
    const { totalIncome, totalExpense } = buildDashboardTotals([makeEntry({ type: null, amount: 9999 })])
    expect(totalIncome).toBe(0)
    expect(totalExpense).toBe(0)
  })

  it('unknown entry_type does NOT enter any total — not treated as expense', () => {
    const { totalIncome, totalExpense } = buildDashboardTotals([makeEntry({ type: 'debit', amount: 7777 })])
    expect(totalIncome).toBe(0)
    expect(totalExpense).toBe(0)
  })

  it('invalid (NaN) amount contributes 0', () => {
    const { totalExpense } = buildDashboardTotals([
      makeEntry({ type: 'expense', amount: 'bad' as unknown as number }),
    ])
    expect(totalExpense).toBe(0)
  })

  it('negative amount contributes 0', () => {
    expect(buildDashboardTotals([makeEntry({ type: 'expense', amount: -500 })]).totalExpense).toBe(0)
  })

  it('balance = income - expense', () => {
    const { totalIncome, totalExpense } = buildDashboardTotals([
      makeEntry({ type: 'income', amount: 10000 }),
      makeEntry({ type: 'expense', amount: 4000 }),
    ])
    expect(totalIncome - totalExpense).toBe(6000)
  })

  it('unknown does not shift balance calculation', () => {
    const { totalIncome, totalExpense } = buildDashboardTotals([
      makeEntry({ type: 'income', amount: 10000 }),
      makeEntry({ type: 'debit', amount: 5000 }),
    ])
    expect(totalIncome - totalExpense).toBe(10000)
  })

  it('does not mutate input array', () => {
    const entries = [makeEntry({})]
    const original = [...entries]
    buildDashboardTotals(entries)
    expect(entries).toEqual(original)
  })
})

describe('buildProjectBalances', () => {
  it('project balance excludes unknown entry_type', () => {
    const entries = [
      makeEntry({ project_id: 'p1', type: 'income', amount: 8000 }),
      makeEntry({ project_id: 'p1', type: 'debit', amount: 3000 }),
    ]
    expect(buildProjectBalances(entries).get('p1')).toBe(8000)
  })

  it('income increases balance, expense decreases it', () => {
    const entries = [
      makeEntry({ project_id: 'p1', type: 'income', amount: 5000 }),
      makeEntry({ project_id: 'p1', type: 'expense', amount: 2000 }),
    ]
    expect(buildProjectBalances(entries).get('p1')).toBe(3000)
  })

  it('entries without project_id are ignored', () => {
    const entries = [makeEntry({ project_id: null, type: 'expense', amount: 9999 })]
    expect(buildProjectBalances(entries).size).toBe(0)
  })
})

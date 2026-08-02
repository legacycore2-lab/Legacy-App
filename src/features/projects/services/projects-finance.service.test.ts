import { describe, expect, it } from 'vitest'
import { buildFinanceViewModel, buildMonthlyCashflow } from './projects.service'
import type { ProjectDetails, ProjectEntry } from '../types/project.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<ProjectEntry>): ProjectEntry {
  return {
    id: 'e1',
    seq: 1,
    entryDate: '2025-01-15',
    type: 'income',
    category: 'عمالة',
    description: 'test',
    contractor: '',
    paymentMethod: 'cash',
    amount: 1000,
    ...overrides,
  }
}

function makeDetails(entries: ProjectEntry[]): ProjectDetails {
  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  return {
    project: {
      id: 'p1',
      code: 'P-001',
      name: 'مشروع اختبار',
      client: 'العميل',
      location: 'القاهرة',
      manager: 'محمد',
      status: 'active',
      progress: 50,
      contractValue: 500_000,
      received: totalIncome,
      spent: totalExpense,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
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
      recentEntries: entries.slice(0, 6),
      expenseCategories: [],
    },
  }
}

// ─── buildMonthlyCashflow ─────────────────────────────────────────────────────

describe('buildMonthlyCashflow', () => {
  it('returns exactly 7 bars', () => {
    const bars = buildMonthlyCashflow([])
    expect(bars).toHaveLength(7)
  })

  it('project with no entries — all amounts are zero', () => {
    const bars = buildMonthlyCashflow([])
    for (const bar of bars) {
      expect(bar.incomeAmount).toBe(0)
      expect(bar.expenseAmount).toBe(0)
    }
  })

  it('all heights are 0 when no entries', () => {
    const bars = buildMonthlyCashflow([])
    for (const bar of bars) {
      expect(bar.incomeHeight).toBe(0)
      expect(bar.expenseHeight).toBe(0)
    }
  })

  it('income and expense in the same month are aggregated correctly', () => {
    // Use a date that is definitely within the 7-month window
    const nowUtc = new Date()
    const year = nowUtc.getUTCFullYear()
    const month = String(nowUtc.getUTCMonth() + 1).padStart(2, '0')
    const date = `${year}-${month}-10`

    const entries = [
      makeEntry({ id: 'e1', type: 'income', amount: 3000, entryDate: date }),
      makeEntry({ id: 'e2', type: 'expense', amount: 1200, entryDate: date }),
      makeEntry({ id: 'e3', type: 'income', amount: 500, entryDate: date }),
    ]
    const bars = buildMonthlyCashflow(entries)
    const bar = bars[bars.length - 1] // current month is the last bar
    expect(bar.incomeAmount).toBe(3500)
    expect(bar.expenseAmount).toBe(1200)
  })

  it('December → January year crossing: entries land in different bars', () => {
    // Use two consecutive months within the last 7 months to guarantee both
    // are in the window regardless of when this test runs
    const nowUtc = new Date()
    const currentTotalMonths = nowUtc.getUTCFullYear() * 12 + nowUtc.getUTCMonth()

    // month A = 2 months ago, month B = 1 month ago
    const monthA = currentTotalMonths - 2
    const monthB = currentTotalMonths - 1
    const yearA = Math.floor(monthA / 12)
    const yearB = Math.floor(monthB / 12)
    const mA = String((monthA % 12) + 1).padStart(2, '0')
    const mB = String((monthB % 12) + 1).padStart(2, '0')

    const entries = [
      makeEntry({ id: 'a', entryDate: `${yearA}-${mA}-15`, type: 'income', amount: 8000 }),
      makeEntry({ id: 'b', entryDate: `${yearB}-${mB}-05`, type: 'expense', amount: 4000 }),
    ]
    const bars = buildMonthlyCashflow(entries)

    // bars are ordered oldest→newest; index 4 = 2 months ago, index 5 = 1 month ago
    const barA = bars[4]
    const barB = bars[5]

    expect(barA.incomeAmount).toBe(8000)
    expect(barA.expenseAmount).toBe(0)
    expect(barB.expenseAmount).toBe(4000)
    expect(barB.incomeAmount).toBe(0)
  })

  it('ignores entries with an invalid date', () => {
    const entries = [
      makeEntry({ id: 'bad', entryDate: 'not-a-date', amount: 99999 }),
      makeEntry({ id: 'bad2', entryDate: '', amount: 99999 }),
      makeEntry({ id: 'bad3', entryDate: '2025-13-01', amount: 99999 }), // month 13
    ]
    const bars = buildMonthlyCashflow(entries)
    const totalIncome = bars.reduce((s, b) => s + b.incomeAmount, 0)
    const totalExpense = bars.reduce((s, b) => s + b.expenseAmount, 0)
    expect(totalIncome).toBe(0)
    expect(totalExpense).toBe(0)
  })

  it('ignores entries older than the 7-month window', () => {
    // An entry from 10 years ago should never appear
    const entries = [makeEntry({ id: 'old', entryDate: '2010-06-01', amount: 50000 })]
    const bars = buildMonthlyCashflow(entries)
    const totalIncome = bars.reduce((s, b) => s + b.incomeAmount, 0)
    expect(totalIncome).toBe(0)
  })

  it('normalises heights so the tallest bar reaches 100', () => {
    const nowUtc = new Date()
    const year = nowUtc.getUTCFullYear()
    const month = String(nowUtc.getUTCMonth() + 1).padStart(2, '0')
    const date = `${year}-${month}-01`

    const entries = [makeEntry({ id: 'e1', entryDate: date, type: 'income', amount: 2000 })]
    const bars = buildMonthlyCashflow(entries)
    const maxHeight = Math.max(...bars.map((b) => Math.max(b.incomeHeight, b.expenseHeight)))
    expect(maxHeight).toBe(100)
  })

  it('all heights remain 0 when all amounts are 0', () => {
    const nowUtc = new Date()
    const year = nowUtc.getUTCFullYear()
    const month = String(nowUtc.getUTCMonth() + 1).padStart(2, '0')
    const date = `${year}-${month}-01`
    const entries = [makeEntry({ id: 'e1', entryDate: date, amount: 0 })]
    const bars = buildMonthlyCashflow(entries)
    for (const bar of bars) {
      expect(bar.incomeHeight).toBe(0)
      expect(bar.expenseHeight).toBe(0)
    }
  })

  it('labels are Arabic month names', () => {
    const bars = buildMonthlyCashflow([])
    const arabicMonths = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ]
    for (const bar of bars) {
      expect(arabicMonths).toContain(bar.label)
    }
  })
})

// ─── buildFinanceViewModel ────────────────────────────────────────────────────

describe('buildFinanceViewModel', () => {
  it('project with no entries — summary zeros, hasActivity false', () => {
    const vm = buildFinanceViewModel(makeDetails([]))
    expect(vm.summary.totalIncome).toBe(0)
    expect(vm.summary.totalExpense).toBe(0)
    expect(vm.summary.balance).toBe(0)
    expect(vm.hasActivity).toBe(false)
  })

  it('totalIncome = 0 → profitMargin = 0 (no division by zero)', () => {
    const vm = buildFinanceViewModel(makeDetails([makeEntry({ type: 'expense', amount: 1000 })]))
    expect(vm.profitMargin).toBe(0)
  })

  it('contractValue and remaining are correct', () => {
    const entries = [makeEntry({ type: 'expense', amount: 100_000 })]
    const vm = buildFinanceViewModel(makeDetails(entries))
    expect(vm.contractValue).toBe(500_000)
    expect(vm.remaining).toBe(400_000) // 500_000 - 100_000
  })

  it('remaining is negative when expenses exceed contract value', () => {
    const entries = [makeEntry({ type: 'expense', amount: 600_000 })]
    const vm = buildFinanceViewModel(makeDetails(entries))
    expect(vm.remaining).toBe(-100_000)
  })

  it('incomeSharePercentage + expenseSharePercentage = 100 when both > 0', () => {
    const entries = [
      makeEntry({ id: 'i', type: 'income', amount: 3000 }),
      makeEntry({ id: 'e', type: 'expense', amount: 1000 }),
    ]
    const vm = buildFinanceViewModel(makeDetails(entries))
    expect(vm.incomeSharePercentage + vm.expenseSharePercentage).toBe(100)
  })

  it('both share percentages are 0 when no entries', () => {
    const vm = buildFinanceViewModel(makeDetails([]))
    expect(vm.incomeSharePercentage).toBe(0)
    expect(vm.expenseSharePercentage).toBe(0)
  })

  it('hasActivity is true when at least one entry falls in the 7-month window', () => {
    const nowUtc = new Date()
    const year = nowUtc.getUTCFullYear()
    const month = String(nowUtc.getUTCMonth() + 1).padStart(2, '0')
    const entries = [makeEntry({ entryDate: `${year}-${month}-01` })]
    const vm = buildFinanceViewModel(makeDetails(entries))
    expect(vm.hasActivity).toBe(true)
  })

  it('hasActivity is false when all entries are outside the 7-month window', () => {
    const entries = [makeEntry({ entryDate: '2010-01-01' })]
    const vm = buildFinanceViewModel(makeDetails(entries))
    expect(vm.hasActivity).toBe(false)
  })

  it('monthlyCashflow has exactly 7 bars', () => {
    const vm = buildFinanceViewModel(makeDetails([]))
    expect(vm.monthlyCashflow).toHaveLength(7)
  })

  it('donutGradient is surface-soft when no expense categories', () => {
    const vm = buildFinanceViewModel(makeDetails([]))
    expect(vm.donutGradient).toBe('var(--surface-soft)')
  })
})

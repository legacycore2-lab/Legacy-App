import { describe, expect, it } from 'vitest'
import {
  buildExecutiveKPIs,
  buildJournalAnalyticsViewModel,
  buildProjectHealth,
  buildSmartInsights,
} from './analytics.service'
import type { JournalAnalyticsFilters } from '../types'

const projects = [
  {
    id: 'p1',
    name: 'مشروع النور',
    code: 'P-001',
    client_name: 'شركة النور',
    status: 'active',
    progress: 65,
    contract_value: 10000,
    is_archived: false,
  },
  {
    id: 'p2',
    name: 'مشروع الظلام',
    code: 'P-002',
    client_name: 'عميل قديم',
    status: 'active',
    progress: 40,
    contract_value: 5000,
    is_archived: false,
  },
  {
    id: 'p3',
    name: 'مشروع مؤرشف',
    code: 'P-003',
    client_name: '—',
    status: 'archived',
    progress: 100,
    contract_value: 3000,
    is_archived: true,
  },
]

const entries = [
  {
    id: 'e1',
    entry_number: 1,
    entry_date: '2025-01-10',
    entry_type: 'income',
    category: 'مبيعات',
    description: 'دفعة أولى',
    contractor_name: 'مقاول أ',
    payment_method: 'تحويل',
    amount: 6000,
    project_id: 'p1',
  },
  {
    id: 'e2',
    entry_number: 2,
    entry_date: '2025-01-15',
    entry_type: 'expense',
    category: 'خامات',
    description: 'مواد بناء',
    contractor_name: 'مورد ب',
    payment_method: 'نقد',
    amount: 2000,
    project_id: 'p1',
  },
  {
    id: 'e3',
    entry_number: 3,
    entry_date: '2025-01-20',
    entry_type: 'income',
    category: 'مبيعات',
    description: 'دفعة',
    contractor_name: 'مقاول أ',
    payment_method: 'نقد',
    amount: 1000,
    project_id: 'p2',
  },
  {
    id: 'e4',
    entry_number: 4,
    entry_date: '2025-01-25',
    entry_type: 'expense',
    category: 'عمالة',
    description: 'رواتب',
    contractor_name: null,
    payment_method: 'تحويل',
    amount: 3500,
    project_id: 'p2',
  },
]

const DEFAULT_FILTERS: JournalAnalyticsFilters = {
  dateFrom: '',
  dateTo: '',
  projectId: '',
  entryType: 'all',
  contractor: '',
  paymentMethod: '',
  query: '',
}

describe('buildExecutiveKPIs', () => {
  it('computes totals correctly', () => {
    const kpis = buildExecutiveKPIs(projects, entries)
    expect(kpis.totalProjects).toBe(3)
    expect(kpis.activeProjects).toBe(2)
    expect(kpis.totalIncome).toBe(7000)
    expect(kpis.totalExpense).toBe(5500)
    expect(kpis.netProfit).toBe(1500)
    expect(kpis.profitMargin).toBeCloseTo(21.43, 1)
  })

  it('handles empty data', () => {
    const kpis = buildExecutiveKPIs([], [])
    expect(kpis.totalProjects).toBe(0)
    expect(kpis.netProfit).toBe(0)
    expect(kpis.profitMargin).toBe(0)
  })
})

describe('buildProjectHealth', () => {
  it('excludes archived projects', () => {
    const health = buildProjectHealth(projects, entries)
    expect(health.every((p) => !p.isArchived)).toBe(true)
    expect(health).toHaveLength(2)
  })

  it('sorts by net descending', () => {
    const health = buildProjectHealth(projects, entries)
    expect(health[0].id).toBe('p1')
    expect(health[0].net).toBe(4000)
    expect(health[1].net).toBe(-2500)
  })
})

describe('buildJournalAnalyticsViewModel', () => {
  it('returns all rows with default filters', () => {
    const vm = buildJournalAnalyticsViewModel(entries, DEFAULT_FILTERS)
    expect(vm.rows).toHaveLength(4)
    expect(vm.totals.totalIncome).toBe(7000)
    expect(vm.totals.totalExpense).toBe(5500)
  })

  it('filters by entry type', () => {
    const vm = buildJournalAnalyticsViewModel(entries, { ...DEFAULT_FILTERS, entryType: 'income' })
    expect(vm.rows).toHaveLength(2)
    expect(vm.rows.every((r) => r.type === 'income')).toBe(true)
  })

  it('filters by contractor', () => {
    const vm = buildJournalAnalyticsViewModel(entries, { ...DEFAULT_FILTERS, contractor: 'مقاول أ' })
    expect(vm.rows).toHaveLength(2)
  })

  it('collects unique contractors and payment methods', () => {
    const vm = buildJournalAnalyticsViewModel(entries, DEFAULT_FILTERS)
    expect(vm.contractors).toContain('مقاول أ')
    expect(vm.contractors).toContain('مورد ب')
    expect(vm.paymentMethods).toContain('تحويل')
    expect(vm.paymentMethods).toContain('نقد')
  })

  it('filters by search query', () => {
    const vm = buildJournalAnalyticsViewModel(entries, { ...DEFAULT_FILTERS, query: 'رواتب' })
    expect(vm.rows).toHaveLength(1)
    expect(vm.rows[0].id).toBe('e4')
  })
})

describe('buildSmartInsights', () => {
  it('generates top profit insight', () => {
    const health = buildProjectHealth(projects, entries)
    const insights = buildSmartInsights(health, entries)
    const topProfit = insights.find((i) => i.id === 'top-profit')
    expect(topProfit).toBeDefined()
    expect(topProfit?.severity).toBe('success')
  })

  it('generates loss warning when projects have negative net', () => {
    const health = buildProjectHealth(projects, entries)
    const insights = buildSmartInsights(health, entries)
    const loss = insights.find((i) => i.id === 'loss-projects')
    expect(loss).toBeDefined()
    expect(loss?.severity).toBe('danger')
  })

  it('returns empty array for empty health', () => {
    expect(buildSmartInsights([], [])).toEqual([])
  })
})

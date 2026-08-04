import { describe, expect, it } from 'vitest'
import {
  buildJournalReportViewModel,
  buildReportsViewModel,
  buildSmartInsights,
  filterJournalRows,
  filterReportRows,
  summarizeReportRows,
} from './reports.service'
import type { JournalReportFilters } from '../types/report.types'

// ─── fixtures ────────────────────────────────────────────────────────────────

const projects = [
  {
    id: 'p1',
    name: 'مشروع النور',
    code: 'P-001',
    client_name: 'شركة النور',
    status: 'active',
    progress: 65,
    contract_value: 5000,
    is_archived: false,
  },
  {
    id: 'p2',
    name: 'مشروع مؤرشف',
    code: 'P-002',
    client_name: 'عميل قديم',
    status: 'archived',
    progress: 100,
    contract_value: '3000',
    is_archived: true,
  },
]

const entries = [
  { project_id: 'p1', entry_type: 'income', amount: 3200, entry_number: 1 },
  { project_id: 'p1', entry_type: 'expense', amount: 1200, entry_number: 2 },
  { project_id: 'p1', entry_type: 'unknown', amount: 999, entry_number: 3 },
  { project_id: 'p2', entry_type: 'i', amount: '1500', entry_number: 4 },
]

const journalRecords = [
  {
    id: 'e1',
    entry_date: '2024-01-10',
    entry_type: 'income',
    amount: 2000,
    contractor: 'مقاول أ',
    payment_method: 'cash',
    project_id: 'p1',
    project_name: null,
    description: 'دفعة أولى',
  },
  {
    id: 'e2',
    entry_date: '2024-01-15',
    entry_type: 'expense',
    amount: 800,
    contractor: 'مقاول ب',
    payment_method: 'bank',
    project_id: 'p1',
    project_name: null,
    description: 'مواد بناء',
  },
  {
    id: 'e3',
    entry_date: '2024-02-01',
    entry_type: 'income',
    amount: 1500,
    contractor: null,
    payment_method: null,
    project_id: null,
    project_name: null,
    description: null,
  },
]

// ─── Executive report ─────────────────────────────────────────────────────────

describe('reports service — executive', () => {
  it('builds project financial rows without counting unknown types', () => {
    const result = buildReportsViewModel(projects, entries)
    expect(result.rows[0]).toMatchObject({
      income: 3200,
      expense: 1200,
      net: 2000,
      remaining: 1800,
      entryCount: 3,
    })
    expect(result.summary).toEqual({
      projectCount: 2,
      contractValue: 8000,
      income: 4700,
      expense: 1200,
      net: 3500,
      remaining: 3300,
    })
  })

  it('filters archived projects and supports Arabic search', () => {
    const rows = buildReportsViewModel(projects, entries).rows
    expect(filterReportRows(rows, '', false)).toHaveLength(1)
    expect(filterReportRows(rows, 'النور', true)).toHaveLength(1)
    expect(filterReportRows(rows, 'P-002', true)).toHaveLength(1)
  })

  it('summarizes only the visible rows', () => {
    const rows = filterReportRows(buildReportsViewModel(projects, entries).rows, '', false)
    expect(summarizeReportRows(rows).projectCount).toBe(1)
    expect(summarizeReportRows(rows).net).toBe(2000)
  })
})

// ─── Journal report ───────────────────────────────────────────────────────────

describe('reports service — journal', () => {
  it('builds journal view model with correct totals', () => {
    const vm = buildJournalReportViewModel(journalRecords)
    expect(vm.summary.totalIncome).toBe(3500)
    expect(vm.summary.totalExpense).toBe(800)
    expect(vm.summary.netProfit).toBe(2700)
    expect(vm.summary.entryCount).toBe(3)
  })

  it('collects unique contractors and payment methods', () => {
    const vm = buildJournalReportViewModel(journalRecords)
    expect(vm.contractors).toContain('مقاول أ')
    expect(vm.contractors).toContain('مقاول ب')
    expect(vm.paymentMethods).toContain('cash')
    expect(vm.paymentMethods).toContain('bank')
  })

  it('filters by entry type', () => {
    const vm = buildJournalReportViewModel(journalRecords)
    const filters: JournalReportFilters = {
      query: '',
      dateFrom: '',
      dateTo: '',
      projectId: '',
      entryType: 'income',
      contractor: '',
      paymentMethod: '',
    }
    const rows = filterJournalRows(vm.rows, filters)
    expect(rows.every((r) => r.type === 'income')).toBe(true)
    expect(rows).toHaveLength(2)
  })

  it('filters by date range', () => {
    const vm = buildJournalReportViewModel(journalRecords)
    const filters: JournalReportFilters = {
      query: '',
      dateFrom: '2024-01-12',
      dateTo: '2024-01-20',
      projectId: '',
      entryType: 'all',
      contractor: '',
      paymentMethod: '',
    }
    const rows = filterJournalRows(vm.rows, filters)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('e2')
  })

  it('filters by contractor', () => {
    const vm = buildJournalReportViewModel(journalRecords)
    const filters: JournalReportFilters = {
      query: '',
      dateFrom: '',
      dateTo: '',
      projectId: '',
      entryType: 'all',
      contractor: 'مقاول أ',
      paymentMethod: '',
    }
    const rows = filterJournalRows(vm.rows, filters)
    expect(rows).toHaveLength(1)
  })
})

// ─── Smart Insights ───────────────────────────────────────────────────────────

describe('reports service — insights', () => {
  it('returns no-data insight when no entries', () => {
    const rows = buildReportsViewModel(projects, []).rows
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id === 'no-data')).toBe(true)
  })

  it('flags budget risk when expense > 80% of contract', () => {
    const atRiskProject = [
      {
        id: 'px',
        name: 'مشروع خطر',
        code: 'PX',
        client_name: 'عميل',
        status: 'active',
        progress: 50,
        contract_value: 1000,
        is_archived: false,
      },
    ]
    const atRiskEntries = [
      { project_id: 'px', entry_type: 'income', amount: 100, entry_number: 1 },
      { project_id: 'px', entry_type: 'expense', amount: 850, entry_number: 2 },
    ]
    const { rows } = buildReportsViewModel(atRiskProject, atRiskEntries)
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id.startsWith('budget-risk'))).toBe(true)
  })

  it('flags loss project when net < 0', () => {
    const lossProject = [
      {
        id: 'pl',
        name: 'مشروع خاسر',
        code: 'PL',
        client_name: 'عميل',
        status: 'active',
        progress: 30,
        contract_value: 5000,
        is_archived: false,
      },
    ]
    const lossEntries = [
      { project_id: 'pl', entry_type: 'income', amount: 100, entry_number: 1 },
      { project_id: 'pl', entry_type: 'expense', amount: 600, entry_number: 2 },
    ]
    const { rows } = buildReportsViewModel(lossProject, lossEntries)
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id.startsWith('loss-'))).toBe(true)
    expect(insights.some((i) => i.severity === 'danger')).toBe(true)
  })
})

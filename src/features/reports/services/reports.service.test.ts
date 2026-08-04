import { describe, expect, it } from 'vitest'
import {
  buildExecutiveSummary,
  buildJournalReportViewModel,
  buildProjectReportRows,
  buildReportsViewModel,
  buildSmartInsights,
  buildTopProjects,
  filterJournalRows,
  filterReportRows,
  mapJournalEntry,
  mapReportProject,
  summarizeJournalRows,
  summarizeReportRows,
} from './reports.service'
import type { JournalReportFilters, ReportJournalEntryRecord } from '../types/report.types'

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

function makeJournalRecord(overrides: Partial<ReportJournalEntryRecord> = {}): ReportJournalEntryRecord {
  return {
    id: 'e1',
    entry_date: '2024-03-15',
    entry_type: 'income',
    amount: 1000,
    entry_number: 1,
    contractor_name: 'مقاول أ',
    payment_method: 'cash',
    project_id: 'p1',
    description: 'دفعة',
    project: { name: 'مشروع النور' },
    ...overrides,
  }
}

// ─── mapReportProject ─────────────────────────────────────────────────────────

describe('mapReportProject', () => {
  it('maps income and expense correctly', () => {
    const row = mapReportProject(projects[0], { income: 3200, expense: 1200, entryCount: 2 })
    expect(row.income).toBe(3200)
    expect(row.expense).toBe(1200)
    expect(row.net).toBe(2000)
    expect(row.remaining).toBe(1800)
  })

  it('remaining is 0 when income > contractValue', () => {
    const row = mapReportProject(projects[0], { income: 9999, expense: 0, entryCount: 1 })
    expect(row.remaining).toBe(0)
  })
})

// ─── mapJournalEntry ──────────────────────────────────────────────────────────

describe('mapJournalEntry', () => {
  it('maps income entry with contractor_name', () => {
    const row = mapJournalEntry(makeJournalRecord())
    expect(row.entryType).toBe('income')
    expect(row.contractorName).toBe('مقاول أ')
    expect(row.projectName).toBe('مشروع النور')
    expect(row.amount).toBe(1000)
  })

  it('maps expense with short type e', () => {
    const row = mapJournalEntry(makeJournalRecord({ entry_type: 'e', amount: 500 }))
    expect(row.entryType).toBe('expense')
  })

  it('maps short type i as income', () => {
    const row = mapJournalEntry(makeJournalRecord({ entry_type: 'i' }))
    expect(row.entryType).toBe('income')
  })

  it('maps unknown type as unknown', () => {
    const row = mapJournalEntry(makeJournalRecord({ entry_type: 'xyz' }))
    expect(row.entryType).toBe('unknown')
  })

  it('maps null entry_type as unknown', () => {
    const row = mapJournalEntry(makeJournalRecord({ entry_type: null }))
    expect(row.entryType).toBe('unknown')
  })

  it('maps invalid amount as 0', () => {
    const row = mapJournalEntry(makeJournalRecord({ amount: 'NaN' }))
    expect(row.amount).toBe(0)
  })

  it('maps null amount as 0', () => {
    const row = mapJournalEntry(makeJournalRecord({ amount: null }))
    expect(row.amount).toBe(0)
  })

  it('resolves project name from object', () => {
    const row = mapJournalEntry(makeJournalRecord({ project: { name: 'اختبار' } }))
    expect(row.projectName).toBe('اختبار')
  })

  it('resolves project name from array', () => {
    const row = mapJournalEntry(makeJournalRecord({ project: [{ name: 'مصفوفة' }] }))
    expect(row.projectName).toBe('مصفوفة')
  })

  it('resolves project name as — when null', () => {
    const row = mapJournalEntry(makeJournalRecord({ project: null, project_id: null }))
    expect(row.projectName).toBe('—')
  })

  it('does not mutate the input record', () => {
    const record = makeJournalRecord()
    const original = { ...record }
    mapJournalEntry(record)
    expect(record).toEqual(original)
  })
})

// ─── Executive / Project rows ─────────────────────────────────────────────────

describe('buildReportsViewModel (backward compat)', () => {
  it('builds project financial rows without counting unknown types in totals', () => {
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
})

describe('buildProjectReportRows', () => {
  it('unknown entry type still counts in entryCount but not in financials', () => {
    const rows = buildProjectReportRows(projects, entries)
    const p1 = rows.find((r) => r.id === 'p1')!
    expect(p1.entryCount).toBe(3)
    expect(p1.income).toBe(3200)
    expect(p1.expense).toBe(1200)
  })
})

describe('filterReportRows', () => {
  it('filters archived projects', () => {
    const rows = buildProjectReportRows(projects, entries)
    expect(filterReportRows(rows, '', false)).toHaveLength(1)
  })

  it('supports Arabic search', () => {
    const rows = buildProjectReportRows(projects, entries)
    expect(filterReportRows(rows, 'النور', true)).toHaveLength(1)
    expect(filterReportRows(rows, 'P-002', true)).toHaveLength(1)
  })
})

describe('summarizeReportRows / buildExecutiveSummary', () => {
  it('summarizes only the visible rows', () => {
    const rows = filterReportRows(buildProjectReportRows(projects, entries), '', false)
    const summary = summarizeReportRows(rows)
    expect(summary.projectCount).toBe(1)
    expect(summary.net).toBe(2000)
  })
})

// ─── buildTopProjects ─────────────────────────────────────────────────────────

describe('buildTopProjects', () => {
  it('profitable excludes loss-making projects', () => {
    const rows = buildProjectReportRows(projects, entries)
    const { profitable } = buildTopProjects(rows)
    expect(profitable.every((r) => r.net > 0)).toBe(true)
  })

  it('lossMaking excludes profitable projects', () => {
    const lossProject = [
      { id: 'lp', name: 'خاسر', code: 'LP', client_name: null, status: 'active', progress: 10, contract_value: 1000, is_archived: false },
    ]
    const lossEntries = [
      { project_id: 'lp', entry_type: 'expense', amount: 800, entry_number: 1 },
      { project_id: 'lp', entry_type: 'income', amount: 200, entry_number: 2 },
    ]
    const rows = buildProjectReportRows(lossProject, lossEntries)
    const { lossMaking, profitable } = buildTopProjects(rows)
    expect(lossMaking).toHaveLength(1)
    expect(profitable).toHaveLength(0)
  })

  it('returns at most 5 profitable', () => {
    const manyProjects = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`, name: `مشروع ${i}`, code: `P-${i}`, client_name: null,
      status: 'active', progress: 50, contract_value: 10000, is_archived: false,
    }))
    const manyEntries = manyProjects.map((p, i) => ({
      project_id: p.id, entry_type: 'income', amount: (i + 1) * 100, entry_number: i,
    }))
    const rows = buildProjectReportRows(manyProjects, manyEntries)
    const { profitable } = buildTopProjects(rows)
    expect(profitable.length).toBeLessThanOrEqual(5)
  })
})

// ─── Journal report ───────────────────────────────────────────────────────────

describe('buildJournalReportViewModel', () => {
  const records: ReportJournalEntryRecord[] = [
    makeJournalRecord({ id: 'e1', entry_date: '2024-01-10', amount: 2000, entry_type: 'income', contractor_name: 'مقاول أ', payment_method: 'cash' }),
    makeJournalRecord({ id: 'e2', entry_date: '2024-01-15', amount: 800, entry_type: 'expense', contractor_name: 'مقاول ب', payment_method: 'bank' }),
    makeJournalRecord({ id: 'e3', entry_date: '2024-02-01', amount: 1500, entry_type: 'income', contractor_name: null, payment_method: null, project_id: null, project: null }),
  ]

  it('builds correct totals', () => {
    const vm = buildJournalReportViewModel(records)
    const summary = summarizeJournalRows(vm.allRows)
    expect(summary.totalIncome).toBe(3500)
    expect(summary.totalExpense).toBe(800)
    expect(summary.netProfit).toBe(2700)
    expect(summary.entryCount).toBe(3)
  })

  it('collects unique contractors', () => {
    const vm = buildJournalReportViewModel(records)
    expect(vm.contractors).toContain('مقاول أ')
    expect(vm.contractors).toContain('مقاول ب')
    expect(vm.contractors).not.toContain(null)
  })

  it('collects payment methods', () => {
    const vm = buildJournalReportViewModel(records)
    expect(vm.paymentMethods).toContain('cash')
    expect(vm.paymentMethods).toContain('bank')
  })
})

// ─── filterJournalRows ────────────────────────────────────────────────────────

const baseFilters: JournalReportFilters = {
  query: '', dateFrom: '', dateTo: '', projectId: '',
  entryType: 'all', contractorName: '', paymentMethod: '',
}

const journalVm = buildJournalReportViewModel([
  makeJournalRecord({ id: 'e1', entry_date: '2024-01-10', entry_type: 'income', contractor_name: 'مقاول أ', payment_method: 'cash', project_id: 'p1' }),
  makeJournalRecord({ id: 'e2', entry_date: '2024-01-20', entry_type: 'expense', contractor_name: 'مقاول ب', payment_method: 'bank', project_id: 'p2' }),
  makeJournalRecord({ id: 'e3', entry_date: '2024-02-05', entry_type: 'income', contractor_name: 'مقاول أ', payment_method: 'cash', project_id: 'p1' }),
])

describe('filterJournalRows', () => {
  it('filters by entry type income', () => {
    const rows = filterJournalRows(journalVm.allRows, { ...baseFilters, entryType: 'income' })
    expect(rows.every((r) => r.entryType === 'income')).toBe(true)
    expect(rows).toHaveLength(2)
  })

  it('filters by date range', () => {
    const rows = filterJournalRows(journalVm.allRows, { ...baseFilters, dateFrom: '2024-01-15', dateTo: '2024-01-25' })
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('e2')
  })

  it('filters by project', () => {
    const rows = filterJournalRows(journalVm.allRows, { ...baseFilters, projectId: 'p1' })
    expect(rows).toHaveLength(2)
  })

  it('filters by contractor name', () => {
    const rows = filterJournalRows(journalVm.allRows, { ...baseFilters, contractorName: 'مقاول ب' })
    expect(rows).toHaveLength(1)
  })

  it('filters by payment method', () => {
    const rows = filterJournalRows(journalVm.allRows, { ...baseFilters, paymentMethod: 'cash' })
    expect(rows).toHaveLength(2)
  })

  it('filters by text search in description', () => {
    const recordsWithDesc = [
      makeJournalRecord({ id: 'x1', description: 'دفعة أولى', entry_type: 'income' }),
      makeJournalRecord({ id: 'x2', description: 'مواد بناء', entry_type: 'expense' }),
    ]
    const vm = buildJournalReportViewModel(recordsWithDesc)
    const rows = filterJournalRows(vm.allRows, { ...baseFilters, query: 'بناء' })
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('x2')
  })
})

// ─── buildSmartInsights ───────────────────────────────────────────────────────

describe('buildSmartInsights', () => {
  it('returns no-data insight when no entries exist', () => {
    const rows = buildProjectReportRows(projects, [])
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id === 'no-data')).toBe(true)
  })

  it('flags budget risk only when contractValue > 0 and expense > 80%', () => {
    const p = [{ id: 'br', name: 'خطر', code: 'BR', client_name: null, status: 'active', progress: 0, contract_value: 1000, is_archived: false }]
    const e = [
      { project_id: 'br', entry_type: 'income', amount: 50, entry_number: 1 },
      { project_id: 'br', entry_type: 'expense', amount: 850, entry_number: 2 },
    ]
    const rows = buildProjectReportRows(p, e)
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id.startsWith('budget-risk-'))).toBe(true)
  })

  it('does NOT flag budget risk when contractValue is 0', () => {
    const p = [{ id: 'nv', name: 'بلا عقد', code: 'NV', client_name: null, status: 'active', progress: 0, contract_value: 0, is_archived: false }]
    const e = [
      { project_id: 'nv', entry_type: 'expense', amount: 500, entry_number: 1 },
    ]
    const rows = buildProjectReportRows(p, e)
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id.startsWith('budget-risk-'))).toBe(false)
  })

  it('flags loss project when net < 0', () => {
    const p = [{ id: 'ls', name: 'خاسر', code: 'LS', client_name: null, status: 'active', progress: 0, contract_value: 5000, is_archived: false }]
    const e = [
      { project_id: 'ls', entry_type: 'income', amount: 100, entry_number: 1 },
      { project_id: 'ls', entry_type: 'expense', amount: 600, entry_number: 2 },
    ]
    const rows = buildProjectReportRows(p, e)
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id.startsWith('loss-'))).toBe(true)
    expect(insights.some((i) => i.severity === 'danger')).toBe(true)
  })

  it('flags projects without entries (no-activity)', () => {
    const rows = buildProjectReportRows(projects, [])
    const insights = buildSmartInsights(rows)
    expect(insights.some((i) => i.id === 'no-activity')).toBe(true)
  })

  it('does not include archived projects in insights', () => {
    const rows = buildProjectReportRows(projects, entries)
    const insights = buildSmartInsights(rows)
    const archivedRelated = insights.filter((i) => i.id.includes('p2'))
    expect(archivedRelated).toHaveLength(0)
  })

  it('does not repeat insight ids', () => {
    const rows = buildProjectReportRows(projects, entries)
    const insights = buildSmartInsights(rows)
    const ids = insights.map((i) => i.id)
    expect(ids).toHaveLength(new Set(ids).size)
  })
})

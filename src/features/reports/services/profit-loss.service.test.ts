import { describe, expect, it } from 'vitest'
import {
  buildProfitLossMonthlyRows,
  buildProfitLossProjectRows,
  buildProfitLossViewModel,
  filterProfitLossEntries,
  summarizeProfitLoss,
} from './profit-loss.service'
import type { ProfitLossEntryRecord } from '../types/profit-loss.types'
import type { ReportProjectRecord } from '../types/report.types'

const projects: ReportProjectRecord[] = [
  {
    id: 'p1',
    name: 'تاج سلطان',
    code: 'P-1',
    client_name: 'عميل 1',
    status: 'active',
    progress: 50,
    contract_value: 300000,
    is_archived: false,
  },
  {
    id: 'p2',
    name: 'مشروع خاسر',
    code: 'P-2',
    client_name: 'عميل 2',
    status: 'active',
    progress: 30,
    contract_value: 200000,
    is_archived: false,
  },
]

const entries: ProfitLossEntryRecord[] = [
  { project_id: 'p1', entry_date: '2026-07-01', entry_type: 'income', amount: 200000, entry_number: 1 },
  { project_id: 'p1', entry_date: '2026-07-05', entry_type: 'expense', amount: 50000, entry_number: 2 },
  { project_id: 'p1', entry_date: '2026-08-01', entry_type: 'e', amount: 20000, entry_number: 3 },
  { project_id: 'p2', entry_date: '2026-08-02', entry_type: 'i', amount: 10000, entry_number: 4 },
  { project_id: 'p2', entry_date: '2026-08-03', entry_type: 'expense', amount: 40000, entry_number: 5 },
  { project_id: 'p2', entry_date: '2026-08-04', entry_type: 'unknown', amount: 9000, entry_number: 6 },
]

describe('filterProfitLossEntries', () => {
  it('filters inclusively by date range', () => {
    const result = filterProfitLossEntries(entries, {
      dateFrom: '2026-08-01',
      dateTo: '2026-08-03',
      projectId: '',
    })

    expect(result.map((entry) => entry.entry_number)).toEqual([3, 4, 5])
  })

  it('filters by project', () => {
    const result = filterProfitLossEntries(entries, {
      dateFrom: '',
      dateTo: '',
      projectId: 'p1',
    })

    expect(result).toHaveLength(3)
    expect(result.every((entry) => entry.project_id === 'p1')).toBe(true)
  })

  it('does not mutate source entries', () => {
    const snapshot = structuredClone(entries)
    filterProfitLossEntries(entries, { dateFrom: '2026-08-01', dateTo: '', projectId: '' })
    expect(entries).toEqual(snapshot)
  })
})

describe('buildProfitLossProjectRows', () => {
  it('normalizes income/i and expense/e correctly', () => {
    const rows = buildProfitLossProjectRows(projects, entries)
    const p1 = rows.find((row) => row.projectId === 'p1')

    expect(p1).toMatchObject({
      income: 200000,
      expense: 70000,
      net: 130000,
      marginPercent: 65,
      entryCount: 3,
    })
  })

  it('keeps unknown entries visible in count but excludes their amounts from totals', () => {
    const rows = buildProfitLossProjectRows(projects, entries)
    const p2 = rows.find((row) => row.projectId === 'p2')

    expect(p2).toMatchObject({
      income: 10000,
      expense: 40000,
      net: -30000,
      entryCount: 3,
    })
  })

  it('sorts projects by net descending without mutating inputs', () => {
    const projectSnapshot = structuredClone(projects)
    const entrySnapshot = structuredClone(entries)
    const rows = buildProfitLossProjectRows(projects, entries)

    expect(rows.map((row) => row.projectId)).toEqual(['p1', 'p2'])
    expect(projects).toEqual(projectSnapshot)
    expect(entries).toEqual(entrySnapshot)
  })
})

describe('buildProfitLossMonthlyRows', () => {
  it('groups entries by month and orders months ascending', () => {
    const rows = buildProfitLossMonthlyRows(entries)

    expect(rows).toEqual([
      { monthKey: '2026-07', monthLabel: '2026-07', income: 200000, expense: 50000, net: 150000 },
      { monthKey: '2026-08', monthLabel: '2026-08', income: 10000, expense: 60000, net: -50000 },
    ])
  })

  it('ignores malformed dates', () => {
    const rows = buildProfitLossMonthlyRows([
      ...entries,
      { project_id: 'p1', entry_date: 'invalid', entry_type: 'income', amount: 5000, entry_number: 7 },
    ])

    expect(rows).toHaveLength(2)
  })
})

describe('summarizeProfitLoss', () => {
  it('builds totals and margin from project rows', () => {
    const rows = buildProfitLossProjectRows(projects, entries)
    const summary = summarizeProfitLoss(rows, entries.length)

    expect(summary).toEqual({
      totalIncome: 210000,
      totalExpense: 110000,
      netProfit: 100000,
      profitMarginPercent: 47.62,
      projectCount: 2,
      entryCount: 6,
    })
  })

  it('returns null margin when there is no income', () => {
    const summary = summarizeProfitLoss(
      [
        {
          projectId: 'p1',
          projectName: 'مشروع',
          contractValue: 0,
          income: 0,
          expense: 100,
          net: -100,
          marginPercent: null,
          entryCount: 1,
        },
      ],
      1,
    )

    expect(summary.profitMarginPercent).toBeNull()
  })
})

describe('buildProfitLossViewModel', () => {
  it('selects top profit and top loss projects', () => {
    const viewModel = buildProfitLossViewModel(projects, entries, {
      dateFrom: '',
      dateTo: '',
      projectId: '',
    })

    expect(viewModel.topProfitProject?.projectId).toBe('p1')
    expect(viewModel.topLossProject?.projectId).toBe('p2')
  })

  it('applies project filter to rows and summary while keeping all project options', () => {
    const viewModel = buildProfitLossViewModel(projects, entries, {
      dateFrom: '',
      dateTo: '',
      projectId: 'p2',
    })

    expect(viewModel.projectRows.map((row) => row.projectId)).toEqual(['p2'])
    expect(viewModel.summary.netProfit).toBe(-30000)
    expect(viewModel.projectOptions).toHaveLength(2)
  })
})

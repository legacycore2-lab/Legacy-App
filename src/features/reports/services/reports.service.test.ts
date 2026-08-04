import { describe, expect, it } from 'vitest'
import {
  buildReportsAnalytics,
  buildReportsViewModel,
  filterReportRows,
  summarizeReportRows,
} from './reports.service'

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

describe('reports service', () => {
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

  it('filters archived projects, status, and Arabic search', () => {
    const rows = buildReportsViewModel(projects, entries).rows
    expect(filterReportRows(rows, '', false, 'all')).toHaveLength(1)
    expect(filterReportRows(rows, 'النور', true, 'active')).toHaveLength(1)
    expect(filterReportRows(rows, 'P-002', true, 'archived')).toHaveLength(1)
    expect(filterReportRows(rows, '', true, 'active')).toHaveLength(1)
  })

  it('summarizes only the visible rows', () => {
    const rows = filterReportRows(buildReportsViewModel(projects, entries).rows, '', false, 'all')
    expect(summarizeReportRows(rows).projectCount).toBe(1)
    expect(summarizeReportRows(rows).net).toBe(2000)
  })

  it('builds analytics for visible projects', () => {
    const rows = buildReportsViewModel(projects, entries).rows
    const analytics = buildReportsAnalytics(rows)
    expect(analytics.statusOptions).toEqual([
      { value: 'active', count: 1 },
      { value: 'archived', count: 1 },
    ])
    expect(analytics.topProjects[0]).toMatchObject({ projectId: 'p1', net: 2000 })
    expect(analytics.profitableProjects).toBe(2)
    expect(analytics.lossProjects).toBe(0)
  })
})

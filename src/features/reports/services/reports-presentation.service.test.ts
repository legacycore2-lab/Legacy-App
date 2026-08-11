import { describe, expect, it } from 'vitest'
import {
  buildReportTabularRows,
  getReportTitle,
  isContractorReport,
  resolveContractorReportSection,
  resolveReportsTab,
  selectProjectReportRows,
} from './reports-presentation.service'
import type { ReportProjectRow } from '../types/report.types'

const projectRows: ReportProjectRow[] = [
  {
    id: 'p1',
    name: 'ربح',
    code: 'P1',
    client: 'عميل',
    status: 'active',
    progress: 50,
    contractValue: 1000,
    income: 800,
    expense: 300,
    net: 500,
    remaining: 200,
    entryCount: 3,
    isArchived: false,
  },
  {
    id: 'p2',
    name: 'خسارة',
    code: 'P2',
    client: 'عميل',
    status: 'active',
    progress: 25,
    contractValue: 900,
    income: 100,
    expense: 400,
    net: -300,
    remaining: 800,
    entryCount: 2,
    isArchived: false,
  },
]

describe('reports presentation service', () => {
  it('resolves report tabs and contractor sections', () => {
    expect(resolveReportsTab('journal')).toBe('journal')
    expect(resolveReportsTab('profitable-projects')).toBe('projects')
    expect(resolveReportsTab('profit-loss')).toBeNull()
    expect(resolveContractorReportSection('contractor-statement')).toBe('statement')
    expect(resolveContractorReportSection('contractor-payments')).toBe('payments')
    expect(resolveContractorReportSection('top-contractors')).toBe('overview')
  })

  it('identifies contractor reports and titles', () => {
    expect(isContractorReport('contractor-dues')).toBe(true)
    expect(isContractorReport('journal')).toBe(false)
    expect(getReportTitle('journal')).toBe('تقرير القيود اليومية')
  })

  it('selects profitable and loss-making project rows without mutating source', () => {
    const source = [...projectRows]
    expect(selectProjectReportRows('profitable-projects', source).map((row) => row.id)).toEqual(['p1'])
    expect(selectProjectReportRows('loss-making-projects', source).map((row) => row.id)).toEqual(['p2'])
    expect(source.map((row) => row.id)).toEqual(['p1', 'p2'])
  })

  it('builds journal tabular rows from displayed report data', () => {
    const rows = buildReportTabularRows({
      selectedReport: 'journal',
      activeTab: 'journal',
      executiveRows: [],
      projectRows: [],
      journalRows: [
        {
          id: 'e1',
          date: '2026-08-11',
          dateFormatted: '11/08/2026',
          entryType: 'expense',
          amount: 250,
          contractorName: 'مقاول',
          paymentMethod: 'نقدي',
          projectId: 'p1',
          projectName: 'مشروع',
          description: 'مصروف',
        },
      ],
      profitLoss: null,
      contractors: null,
    })

    expect(rows).toEqual([
      {
        التاريخ: '11/08/2026',
        النوع: 'expense',
        المشروع: 'مشروع',
        المقاول: 'مقاول',
        البيان: 'مصروف',
        'طريقة الدفع': 'نقدي',
        المبلغ: 250,
      },
    ])
  })
})

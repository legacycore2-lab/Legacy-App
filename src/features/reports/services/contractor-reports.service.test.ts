import { describe, expect, it } from 'vitest'
import {
  buildContractorCategoryRows,
  buildContractorDataQualityRows,
  buildContractorMonthlyRows,
  buildContractorPaymentMethodRows,
  buildContractorProjectRows,
  buildContractorReportsViewModel,
  buildContractorSummaryRows,
  filterContractorReportEntries,
  mapContractorReportEntry,
} from './contractor-reports.service'
import type { ContractorReportEntryRecord, ContractorReportsFilters } from '../types/contractor-reports.types'

const records: ContractorReportEntryRecord[] = [
  {
    id: 'e1',
    entry_number: 1,
    entry_date: '2026-07-01',
    entry_type: 'expense',
    amount: 1000,
    contractor_name: 'محمود مصباح',
    category: 'تشطيبات',
    description: 'دفعة أولى',
    payment_method: 'تحويل',
    project_id: 'p1',
    project: { name: 'تاج سلطان' },
  },
  {
    id: 'e2',
    entry_number: 2,
    entry_date: '2026-07-15',
    entry_type: 'e',
    amount: 500,
    contractor_name: 'محمود مصباح',
    category: 'تشطيبات',
    description: 'دفعة ثانية',
    payment_method: 'نقدي',
    project_id: 'p1',
    project: [{ name: 'تاج سلطان' }],
  },
  {
    id: 'e3',
    entry_number: 3,
    entry_date: '2026-08-02',
    entry_type: 'income',
    amount: 200,
    contractor_name: 'أحمد علي',
    category: 'نجارة',
    description: null,
    payment_method: 'تحويل',
    project_id: 'p2',
    project: { name: 'المكتب' },
  },
  {
    id: 'e4',
    entry_number: 4,
    entry_date: '2026-08-03',
    entry_type: 'debit',
    amount: 700,
    contractor_name: 'أحمد علي',
    category: null,
    description: 'نوع غير معروف',
    payment_method: null,
    project_id: null,
    project: null,
  },
  {
    id: 'e5',
    entry_number: 5,
    entry_date: '2026-08-04',
    entry_type: 'expense',
    amount: 300,
    contractor_name: null,
    category: 'نقل',
    description: 'بدون مقاول',
    payment_method: 'نقدي',
    project_id: 'p1',
    project: { name: 'تاج سلطان' },
  },
]

const emptyFilters: ContractorReportsFilters = {
  query: '',
  contractorName: '',
  projectId: '',
  category: '',
  entryType: 'all',
  dateFrom: '',
  dateTo: '',
}

const entries = records.map(mapContractorReportEntry)

describe('contractor reports service', () => {
  it('maps relations, unknown types and missing values safely', () => {
    expect(entries[0]?.projectName).toBe('تاج سلطان')
    expect(entries[1]?.projectName).toBe('تاج سلطان')
    expect(entries[3]).toMatchObject({
      entryType: 'unknown',
      amount: 700,
      category: 'بدون بند',
      paymentMethod: 'غير محددة',
      projectName: 'بدون مشروع',
    })
    expect(entries[4]?.contractorName).toBe('بدون اسم مقاول')
  })

  it('filters by every supported dimension', () => {
    expect(
      filterContractorReportEntries(entries, { ...emptyFilters, contractorName: 'محمود مصباح' }),
    ).toHaveLength(2)
    expect(filterContractorReportEntries(entries, { ...emptyFilters, projectId: 'p2' })).toHaveLength(1)
    expect(filterContractorReportEntries(entries, { ...emptyFilters, category: 'نجارة' })).toHaveLength(1)
    expect(filterContractorReportEntries(entries, { ...emptyFilters, entryType: 'unknown' })).toHaveLength(1)
    expect(filterContractorReportEntries(entries, { ...emptyFilters, dateFrom: '2026-08-01' })).toHaveLength(
      3,
    )
    expect(filterContractorReportEntries(entries, { ...emptyFilters, query: 'دفعة ثانية' })).toHaveLength(1)
  })

  it('builds ranking without coercing unknown types into expense', () => {
    const rows = buildContractorSummaryRows(entries)
    expect(rows[0]).toMatchObject({ contractorName: 'محمود مصباح', totalExpense: 1500, entryCount: 2 })
    expect(rows.find((row) => row.contractorName === 'أحمد علي')).toMatchObject({
      totalIncome: 200,
      totalExpense: 0,
      entryCount: 2,
    })
  })

  it('builds contractor per-project totals', () => {
    expect(
      buildContractorProjectRows(entries).find((row) => row.contractorName === 'محمود مصباح'),
    ).toMatchObject({
      projectName: 'تاج سلطان',
      totalExpense: 1500,
      entryCount: 2,
    })
  })

  it('builds categories with contractor-relative percentages', () => {
    expect(
      buildContractorCategoryRows(entries).find((row) => row.contractorName === 'محمود مصباح'),
    ).toMatchObject({
      category: 'تشطيبات',
      totalExpense: 1500,
      percentageOfContractorExpense: 100,
    })
  })

  it('builds monthly activity in newest-first order', () => {
    const rows = buildContractorMonthlyRows(entries)
    expect(rows[0]?.monthKey).toBe('2026-08')
    expect(rows.at(-1)?.monthKey).toBe('2026-07')
  })

  it('builds payment-method distribution from expense entries only', () => {
    const rows = buildContractorPaymentMethodRows(entries)

    // محمود مصباح: 2 expense entries (1000 تحويل + 500 نقدي) — income/unknown excluded
    const transfer = rows.find((row) => row.contractorName === 'محمود مصباح' && row.paymentMethod === 'تحويل')
    const cash = rows.find((row) => row.contractorName === 'محمود مصباح' && row.paymentMethod === 'نقدي')
    expect(transfer).toMatchObject({ totalAmount: 1000, entryCount: 1 })
    expect(cash).toMatchObject({ totalAmount: 500, entryCount: 1 })
    // percentages from total expense (1500)
    expect(transfer?.percentageOfContractorMovement).toBeCloseTo(66.67)
    expect(cash?.percentageOfContractorMovement).toBeCloseTo(33.33)

    // أحمد علي: only income + unknown — no expense rows → not in payment report
    expect(rows.find((row) => row.contractorName === 'أحمد علي')).toBeUndefined()
  })

  it('excludes income and unknown entries from payment-method rows', () => {
    const rows = buildContractorPaymentMethodRows(entries)
    // e3 is income (أحمد علي / تحويل) — must not appear
    const ahmedTransfer = rows.find(
      (row) => row.contractorName === 'أحمد علي' && row.paymentMethod === 'تحويل',
    )
    expect(ahmedTransfer).toBeUndefined()
    // e4 is unknown (أحمد علي) — must not appear
    const ahmedUnknown = rows.find((row) => row.contractorName === 'أحمد علي')
    expect(ahmedUnknown).toBeUndefined()
  })

  it('reports missing fields and unknown types as quality issues', () => {
    const rows = buildContractorDataQualityRows(entries)
    expect(rows.find((row) => row.kind === 'missing-contractor')?.count).toBe(1)
    expect(rows.find((row) => row.kind === 'missing-project')?.count).toBe(1)
    expect(rows.find((row) => row.kind === 'missing-category')?.count).toBe(1)
    expect(rows.find((row) => row.kind === 'missing-payment-method')?.count).toBe(1)
    expect(rows.find((row) => row.kind === 'unknown-entry-type')).toMatchObject({
      count: 1,
      totalAmount: 700,
    })
  })

  it('builds the complete suite from one record set', () => {
    const viewModel = buildContractorReportsViewModel(records, emptyFilters)
    expect(viewModel.overview).toMatchObject({
      contractorCount: 2,
      projectCount: 2,
      totalExpense: 1500,
      totalIncome: 200,
      entryCount: 4,
    })
    expect(viewModel.contractorOptions).toEqual(['أحمد علي', 'محمود مصباح'])
    expect(viewModel.projectOptions).toHaveLength(2)
    expect(viewModel.categoryOptions).toEqual(['تشطيبات', 'نجارة', 'نقل'])
  })

  it('does not mutate inputs', () => {
    const before = structuredClone(entries)
    buildContractorSummaryRows(entries)
    buildContractorProjectRows(entries)
    buildContractorCategoryRows(entries)
    expect(entries).toEqual(before)
  })
})

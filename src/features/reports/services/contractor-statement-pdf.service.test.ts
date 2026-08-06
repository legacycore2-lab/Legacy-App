import { describe, expect, it } from 'vitest'
import { buildContractorStatementPdfPayload } from './contractor-statement-pdf.service'
import type { ContractorReportsFilters, ContractorReportsViewModel } from '../types/contractor-reports.types'

const filters: ContractorReportsFilters = {
  query: '',
  contractorName: 'محمود مصباح',
  projectId: 'p1',
  category: '',
  entryType: 'all',
  dateFrom: '2026-08-01',
  dateTo: '2026-08-31',
}

const data = {
  overview: {
    contractorCount: 1,
    activeContractorCount: 1,
    totalIncome: 0,
    totalExpense: 25000,
    netMovement: -25000,
    entryCount: 2,
    projectCount: 1,
    topCostContractor: null,
  },
  contractors: [],
  entries: [
    {
      id: 'e2',
      entryNumber: 2,
      entryDate: '2026-08-10',
      entryType: 'expense',
      amount: 10000,
      contractorName: 'محمود مصباح',
      category: 'أسمنت',
      description: 'دفعة ثانية',
      paymentMethod: 'نقدي',
      projectId: 'p1',
      projectName: 'تاج سلطان',
    },
    {
      id: 'e1',
      entryNumber: 1,
      entryDate: '2026-08-05',
      entryType: 'expense',
      amount: 15000,
      contractorName: 'محمود مصباح',
      category: 'حديد',
      description: 'دفعة أولى',
      paymentMethod: 'تحويل',
      projectId: 'p1',
      projectName: 'تاج سلطان',
    },
    {
      id: 'income',
      entryNumber: 3,
      entryDate: '2026-08-12',
      entryType: 'income',
      amount: 4000,
      contractorName: 'محمود مصباح',
      category: 'تسوية',
      description: 'لا تدخل الدفعات',
      paymentMethod: 'تحويل',
      projectId: 'p1',
      projectName: 'تاج سلطان',
    },
  ],
  contractorProjects: [],
  categories: [],
  monthlyActivity: [],
  paymentMethods: [],
  dataQuality: [],
  contractorOptions: ['محمود مصباح'],
  projectOptions: [{ id: 'p1', name: 'تاج سلطان' }],
  categoryOptions: ['حديد', 'أسمنت'],
} satisfies ContractorReportsViewModel

describe('buildContractorStatementPdfPayload', () => {
  it('uses the approved contractor statement title and filters', () => {
    const payload = buildContractorStatementPdfPayload(data, filters)

    expect(payload.reportTitle).toBe('كشف حساب المقاول')
    expect(payload.activeTab).toBe('contractor-statement')
    expect(payload.activeFilters).toEqual([
      { label: 'المقاول', value: 'محمود مصباح' },
      { label: 'المشروع', value: 'تاج سلطان' },
      { label: 'من', value: '2026-08-01' },
      { label: 'إلى', value: '2026-08-31' },
    ])
  })

  it('exports expense payments oldest-first with running balances', () => {
    const payload = buildContractorStatementPdfPayload(data, filters)
    const paymentTable = payload.tables[0]

    expect(paymentTable?.headers).toContain('الرصيد بعد الحركة')
    expect(paymentTable?.rows).toHaveLength(2)
    expect(paymentTable?.rows[0]).toContain('2026-08-05')
    expect(paymentTable?.rows[0]?.at(-1)).toContain('١٥')
    expect(paymentTable?.rows[1]?.at(-1)).toContain('٢٥')
  })

  it('does not export income entries as contractor payments', () => {
    const payload = buildContractorStatementPdfPayload(data, filters)
    const serialized = JSON.stringify(payload.tables[0]?.rows)

    expect(serialized).not.toContain('لا تدخل الدفعات')
    expect(serialized).not.toContain('4000')
  })

  it('includes the account summary without fake dues', () => {
    const payload = buildContractorStatementPdfPayload(data, filters)
    const labels = payload.tables[1]?.rows.map((row) => row[0])

    expect(labels).toContain('إجمالي المدفوعات')
    expect(labels).toContain('الرصيد الحالي')
    expect(labels).not.toContain('المستحقات')
  })
})

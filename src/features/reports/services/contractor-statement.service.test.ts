import { describe, expect, it } from 'vitest'
import { buildContractorStatement } from './contractor-statement.service'
import type { ContractorStatementSourceEntry } from '../types/contractor-statement.types'

const entries: ContractorStatementSourceEntry[] = [
  {
    id: 'expense-late',
    entryNumber: 12,
    entryDate: '2026-08-18',
    entryType: 'expense',
    amount: 8000,
    contractorName: 'محمود مصباح',
    projectId: 'p2',
    projectName: 'بالم هيلز',
    category: 'كهرباء',
    description: 'أعمال كهرباء',
    paymentMethod: 'شيك',
  },
  {
    id: 'income-excluded',
    entryNumber: 9,
    entryDate: '2026-08-08',
    entryType: 'income',
    amount: 2000,
    contractorName: 'محمود مصباح',
    projectId: 'p1',
    projectName: 'تاج سلطان',
    category: 'تسوية',
    description: 'إيراد لا يدخل الدفعات',
    paymentMethod: 'تحويل',
  },
  {
    id: 'expense-first',
    entryNumber: 5,
    entryDate: '2026-08-05',
    entryType: 'expense',
    amount: 15000,
    contractorName: 'محمود مصباح',
    projectId: 'p1',
    projectName: 'تاج سلطان',
    category: 'حديد',
    description: 'شراء حديد',
    paymentMethod: 'تحويل بنكي',
  },
  {
    id: 'expense-second',
    entryNumber: 8,
    entryDate: '2026-08-10',
    entryType: 'expense',
    amount: 10000,
    contractorName: 'محمود مصباح',
    projectId: 'p1',
    projectName: 'تاج سلطان',
    category: 'أسمنت',
    description: 'شراء أسمنت',
    paymentMethod: 'كاش',
  },
  {
    id: 'other-contractor',
    entryNumber: 6,
    entryDate: '2026-08-06',
    entryType: 'expense',
    amount: 4000,
    contractorName: 'محمد شكري',
    projectId: 'p1',
    projectName: 'تاج سلطان',
    category: 'نجارة',
    description: 'دفعة مقاول آخر',
    paymentMethod: 'كاش',
  },
  {
    id: 'unknown-excluded',
    entryNumber: 13,
    entryDate: '2026-08-19',
    entryType: 'unknown',
    amount: 7000,
    contractorName: 'محمود مصباح',
    projectId: 'p2',
    projectName: 'بالم هيلز',
    category: 'غير معروف',
    description: 'نوع غير معروف',
    paymentMethod: 'غير محددة',
  },
]

describe('buildContractorStatement', () => {
  it('returns expense payments for the selected contractor only', () => {
    const result = buildContractorStatement(entries, 'محمود مصباح')

    expect(result.payments.map((payment) => payment.id)).toEqual([
      'expense-first',
      'expense-second',
      'expense-late',
    ])
  })

  it('sorts payments oldest-first and calculates the running balance', () => {
    const result = buildContractorStatement(entries, 'محمود مصباح')

    expect(result.payments.map((payment) => payment.runningBalance)).toEqual([15000, 25000, 33000])
  })

  it('builds the approved statement summary', () => {
    const result = buildContractorStatement(entries, 'محمود مصباح')

    expect(result.summary).toEqual({
      contractorName: 'محمود مصباح',
      totalPayments: 33000,
      paymentCount: 3,
      projectCount: 2,
      averagePayment: 11000,
      firstPaymentDate: '2026-08-05',
      lastPaymentDate: '2026-08-18',
      currentBalance: 33000,
    })
  })

  it('returns an empty statement when no contractor is selected', () => {
    const result = buildContractorStatement(entries, '   ')

    expect(result.payments).toEqual([])
    expect(result.summary.paymentCount).toBe(0)
    expect(result.summary.firstPaymentDate).toBeNull()
    expect(result.summary.lastPaymentDate).toBeNull()
  })

  it('does not mutate the source entries', () => {
    const before = structuredClone(entries)
    buildContractorStatement(entries, 'محمود مصباح')
    expect(entries).toEqual(before)
  })
})

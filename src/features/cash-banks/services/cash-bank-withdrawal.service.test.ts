import { describe, expect, it } from 'vitest'
import type { CashBankWithdrawalInput } from '../types/cash-banks.types'
import { validateCashBankWithdrawalInput } from './cash-banks.service'

const validInput = (overrides: Partial<CashBankWithdrawalInput> = {}): CashBankWithdrawalInput => ({
  sourceAccountId: 'cash-bank-1',
  offsetAccountId: 'ledger-2',
  transactionDate: '2026-07-31',
  amount: '750.25',
  description: 'سداد مصروف تشغيلي',
  referenceNumber: '',
  ...overrides,
})

describe('validateCashBankWithdrawalInput', () => {
  it('accepts a balanced withdrawal within the available balance', () => {
    expect(validateCashBankWithdrawalInput(validInput(), 'ledger-1', 1000)).toEqual([])
  })

  it('rejects missing accounts, date, and description', () => {
    const errors = validateCashBankWithdrawalInput(
      validInput({ sourceAccountId: '', offsetAccountId: '', transactionDate: '', description: ' ' }),
    )
    expect(errors).toHaveLength(4)
  })

  it('rejects invalid amounts and insufficient balance', () => {
    expect(validateCashBankWithdrawalInput(validInput({ amount: '0' }))).toContain(
      'مبلغ السحب يجب أن يكون أكبر من صفر.',
    )
    expect(validateCashBankWithdrawalInput(validInput({ amount: '1001' }), 'ledger-1', 1000)).toContain(
      'الرصيد المتاح لا يكفي لإتمام السحب.',
    )
  })

  it('rejects using the source ledger as the offset account', () => {
    expect(
      validateCashBankWithdrawalInput(validInput({ offsetAccountId: 'ledger-1' }), 'ledger-1'),
    ).toContain('الحساب المقابل يجب أن يختلف عن حساب أستاذ الخزنة أو البنك.')
  })

  it('accepts amount exactly equal to available balance', () => {
    expect(validateCashBankWithdrawalInput(validInput({ amount: '1000' }), 'ledger-1', 1000)).toEqual([])
  })

  it('rejects negative amount', () => {
    expect(validateCashBankWithdrawalInput(validInput({ amount: '-100' }))).toContain(
      'مبلغ السحب يجب أن يكون أكبر من صفر.',
    )
  })

  it('rejects non-numeric amount', () => {
    expect(validateCashBankWithdrawalInput(validInput({ amount: 'abc' }))).toContain(
      'مبلغ السحب يجب أن يكون أكبر من صفر.',
    )
  })
})

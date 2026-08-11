import { describe, expect, it } from 'vitest'
import type { CashBankTransferInput } from '../types/cash-banks.types'
import { validateCashBankTransferInput } from './cash-banks.service'

const validInput = (overrides: Partial<CashBankTransferInput> = {}): CashBankTransferInput => ({
  sourceAccountId: 'cash-bank-1',
  destinationAccountId: 'cash-bank-2',
  transactionDate: '2026-07-31',
  amount: '500.25',
  description: 'تحويل سيولة بين الحسابات',
  referenceNumber: '',
  ...overrides,
})

describe('validateCashBankTransferInput', () => {
  it('accepts a valid transfer within the available balance', () => {
    expect(validateCashBankTransferInput(validInput(), 1000)).toEqual([])
  })

  it('rejects missing accounts, date, and description', () => {
    const errors = validateCashBankTransferInput(
      validInput({ sourceAccountId: '', destinationAccountId: '', transactionDate: '', description: ' ' }),
    )
    expect(errors).toHaveLength(4)
  })

  it('rejects the same source and destination', () => {
    expect(validateCashBankTransferInput(validInput({ destinationAccountId: 'cash-bank-1' }))).toContain(
      'يجب أن يختلف حساب المصدر عن حساب المستفيد.',
    )
  })

  it('rejects invalid amounts and insufficient balance', () => {
    expect(validateCashBankTransferInput(validInput({ amount: '0' }))).toContain(
      'مبلغ التحويل يجب أن يكون أكبر من صفر.',
    )
    expect(validateCashBankTransferInput(validInput({ amount: '1001' }), 1000)).toContain(
      'الرصيد المتاح لا يكفي لإتمام التحويل.',
    )
  })

  it('accepts amount exactly equal to available balance', () => {
    expect(validateCashBankTransferInput(validInput({ amount: '1000' }), 1000)).toEqual([])
  })

  it('rejects negative amount', () => {
    expect(validateCashBankTransferInput(validInput({ amount: '-1' }))).toContain(
      'مبلغ التحويل يجب أن يكون أكبر من صفر.',
    )
  })
})

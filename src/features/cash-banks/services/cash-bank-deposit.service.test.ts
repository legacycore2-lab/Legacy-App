import { describe, expect, it } from 'vitest'
import type { CashBankDepositInput } from '../types/cash-banks.types'
import { validateCashBankDepositInput } from './cash-banks.service'

const validInput = (overrides: Partial<CashBankDepositInput> = {}): CashBankDepositInput => ({
  destinationAccountId: 'cash-bank-1',
  offsetAccountId: 'ledger-2',
  transactionDate: '2026-07-31',
  amount: '1500.25',
  description: 'تحصيل دفعة من عميل',
  referenceNumber: '',
  ...overrides,
})

describe('validateCashBankDepositInput', () => {
  it('accepts a balanced deposit input', () => {
    expect(validateCashBankDepositInput(validInput(), 'ledger-1')).toEqual([])
  })

  it('rejects missing accounts, date, and description', () => {
    const errors = validateCashBankDepositInput(
      validInput({
        destinationAccountId: '',
        offsetAccountId: '',
        transactionDate: '',
        description: ' ',
      }),
    )
    expect(errors).toHaveLength(4)
  })

  it('rejects zero, negative, and invalid amounts', () => {
    expect(validateCashBankDepositInput(validInput({ amount: '0' }))).toContain(
      'مبلغ الإيداع يجب أن يكون أكبر من صفر.',
    )
    expect(validateCashBankDepositInput(validInput({ amount: '-10' }))).toContain(
      'مبلغ الإيداع يجب أن يكون أكبر من صفر.',
    )
    expect(validateCashBankDepositInput(validInput({ amount: 'abc' }))).toContain(
      'مبلغ الإيداع يجب أن يكون أكبر من صفر.',
    )
  })

  it('rejects using the destination ledger as the offset account', () => {
    expect(validateCashBankDepositInput(validInput({ offsetAccountId: 'ledger-1' }), 'ledger-1')).toContain(
      'الحساب المقابل يجب أن يختلف عن حساب أستاذ الخزنة أو البنك.',
    )
  })
})

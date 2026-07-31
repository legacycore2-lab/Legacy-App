import { describe, expect, it } from 'vitest'
import type { CashBankReversalInput } from '../types/cash-banks.types'
import { validateCashBankReversalInput } from './cash-banks.service'

const validInput = (overrides: Partial<CashBankReversalInput> = {}): CashBankReversalInput => ({
  transactionId: 'transaction-1',
  reversalDate: '2026-07-31',
  reason: 'تصحيح تسجيل الحركة على الحساب الخطأ',
  ...overrides,
})

describe('validateCashBankReversalInput', () => {
  it('accepts a complete reversal request', () => {
    expect(validateCashBankReversalInput(validInput())).toEqual([])
  })

  it('requires the original transaction, date, and reason', () => {
    expect(
      validateCashBankReversalInput(validInput({ transactionId: '', reversalDate: '', reason: ' ' })),
    ).toHaveLength(3)
  })
})

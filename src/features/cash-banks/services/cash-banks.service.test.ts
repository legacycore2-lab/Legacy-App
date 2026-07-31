import { describe, expect, it } from 'vitest'
import type { CashBankAccountInput } from '../types/cash-banks.types'
import { validateCashBankAccountInput } from './cash-banks.service'

function validInput(overrides: Partial<CashBankAccountInput> = {}): CashBankAccountInput {
  return {
    ledgerAccountId: 'ledger-1',
    name: 'الخزنة الرئيسية',
    kind: 'cash',
    bankName: '',
    accountNumber: '',
    iban: '',
    branchName: '',
    openingBalance: '0',
    currencyCode: 'EGP',
    isActive: true,
    ...overrides,
  }
}

describe('validateCashBankAccountInput', () => {
  it('accepts a valid cash account', () => {
    expect(validateCashBankAccountInput(validInput())).toEqual([])
  })

  it('rejects missing required values and a negative opening balance', () => {
    const errors = validateCashBankAccountInput(
      validInput({ ledgerAccountId: '', name: '   ', openingBalance: '-1' }),
    )

    expect(errors).toContain('اسم الحساب مطلوب.')
    expect(errors).toContain('حساب الأستاذ مطلوب.')
    expect(errors).toContain('الرصيد الافتتاحي يجب ألا يقل عن صفر.')
  })

  it('rejects bank fields for cash accounts', () => {
    expect(validateCashBankAccountInput(validInput({ bankName: 'بنك مصر' }))).toContain(
      'لا يمكن إضافة بيانات بنكية إلى حساب خزنة.',
    )
  })

  it('accepts optional bank details for bank accounts', () => {
    expect(
      validateCashBankAccountInput(
        validInput({
          kind: 'bank',
          name: 'بنك مصر - جاري',
          bankName: 'بنك مصر',
          accountNumber: '123456',
        }),
      ),
    ).toEqual([])
  })

  it('rejects unsupported currencies', () => {
    expect(validateCashBankAccountInput(validInput({ currencyCode: 'USD' }))).toContain(
      'العملة المتاحة حاليًا هي الجنيه المصري فقط.',
    )
  })
})

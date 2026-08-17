import { describe, expect, it } from 'vitest'
import type { CashBankAccountInput } from '../types/cash-banks.types'
import { validateCashBankAccountInput } from './cash-banks.service'

function validInput(overrides: Partial<CashBankAccountInput> = {}): CashBankAccountInput {
  return {
    ledgerMode: 'existing',
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

// ─── validateCashBankAccountInput — edge cases ────────────────────────────────
describe('validateCashBankAccountInput — name validation', () => {
  it('rejects empty name', () => {
    expect(validateCashBankAccountInput(validInput({ name: '' }))).toContain('اسم الحساب مطلوب.')
  })

  it('rejects whitespace-only name', () => {
    expect(validateCashBankAccountInput(validInput({ name: '   ' }))).toContain('اسم الحساب مطلوب.')
  })

  it('accepts name with leading/trailing whitespace (trimmed internally)', () => {
    expect(validateCashBankAccountInput(validInput({ name: '  خزنة  ' }))).toEqual([])
  })
})

describe('validateCashBankAccountInput — ledger creation mode', () => {
  it('allows automatic ledger creation without a ledger id', () => {
    expect(validateCashBankAccountInput(validInput({ ledgerMode: 'auto', ledgerAccountId: '' }))).toEqual([])
  })

  it('requires a ledger id when linking an existing account', () => {
    expect(
      validateCashBankAccountInput(validInput({ ledgerMode: 'existing', ledgerAccountId: '' })),
    ).toContain('حساب الأستاذ مطلوب.')
  })
})

describe('validateCashBankAccountInput — opening balance edge cases', () => {
  it('accepts opening balance of exactly 0', () => {
    expect(validateCashBankAccountInput(validInput({ openingBalance: '0' }))).toEqual([])
  })

  it('accepts positive opening balance', () => {
    expect(validateCashBankAccountInput(validInput({ openingBalance: '100000' }))).toEqual([])
  })

  it('rejects negative opening balance', () => {
    expect(validateCashBankAccountInput(validInput({ openingBalance: '-1' }))).toContain(
      'الرصيد الافتتاحي يجب ألا يقل عن صفر.',
    )
  })

  it('rejects non-numeric opening balance', () => {
    expect(validateCashBankAccountInput(validInput({ openingBalance: 'abc' }))).toContain(
      'الرصيد الافتتاحي يجب ألا يقل عن صفر.',
    )
  })
})

describe('validateCashBankAccountInput — kind validation', () => {
  it('rejects invalid kind', () => {
    expect(validateCashBankAccountInput(validInput({ kind: 'savings' as 'cash' | 'bank' }))).toContain(
      'نوع الحساب غير صالح.',
    )
  })

  it('accepts cash kind without bank details', () => {
    expect(validateCashBankAccountInput(validInput({ kind: 'cash' }))).toEqual([])
  })

  it('accepts bank kind without bank details', () => {
    expect(validateCashBankAccountInput(validInput({ kind: 'bank' }))).toEqual([])
  })

  it('rejects cash kind with bank name populated', () => {
    expect(validateCashBankAccountInput(validInput({ kind: 'cash', bankName: 'بنك مصر' }))).toContain(
      'لا يمكن إضافة بيانات بنكية إلى حساب خزنة.',
    )
  })

  it('rejects cash kind with account number populated', () => {
    expect(validateCashBankAccountInput(validInput({ kind: 'cash', accountNumber: '123456' }))).toContain(
      'لا يمكن إضافة بيانات بنكية إلى حساب خزنة.',
    )
  })
})

describe('validateCashBankAccountInput — currency', () => {
  it('rejects unsupported currency', () => {
    expect(validateCashBankAccountInput(validInput({ currencyCode: 'USD' }))).toContain(
      'العملة المتاحة حاليًا هي الجنيه المصري فقط.',
    )
  })

  it('accepts EGP', () => {
    expect(validateCashBankAccountInput(validInput({ currencyCode: 'EGP' }))).toEqual([])
  })
})

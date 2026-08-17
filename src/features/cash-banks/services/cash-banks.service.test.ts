import { describe, expect, it } from 'vitest'
import type { CashBankAccountInput, CashBankBalanceRow } from '../types/cash-banks.types'
import { buildAccountSummaries, buildMetrics, validateCashBankAccountInput } from './cash-banks.service'

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

function balance(overrides: Partial<CashBankBalanceRow> = {}): CashBankBalanceRow {
  return {
    id: 'cash-bank-1',
    ledger_account_id: 'ledger-1',
    name: 'CIB',
    account_kind: 'bank',
    bank_name: 'CIB',
    account_number: null,
    iban: null,
    branch_name: null,
    currency_code: 'EGP',
    is_active: true,
    opening_balance: 0,
    current_balance: 250,
    ...overrides,
  }
}

describe('cash and bank account visibility', () => {
  it('keeps inactive accounts visible for management', () => {
    expect(buildAccountSummaries([balance({ is_active: false })])).toEqual([
      expect.objectContaining({ id: 'cash-bank-1', isActive: false }),
    ])
  })

  it('excludes inactive accounts from operational totals and active count', () => {
    const active = balance({ id: 'active', current_balance: 250 })
    const metrics = buildMetrics([
      active,
      balance({ id: 'inactive', is_active: false, current_balance: 900 }),
    ])

    expect(metrics.find((metric) => metric.id === 'liquidity')?.value).toBe(
      buildMetrics([active]).find((metric) => metric.id === 'liquidity')?.value,
    )
    expect(metrics.find((metric) => metric.id === 'accounts')?.value).toBe('1')
  })
})

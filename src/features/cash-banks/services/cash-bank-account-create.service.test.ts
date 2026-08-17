import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkDuplicateAccountName,
  createCashBankAccount,
  createCashBankAccountWithLedger,
  updateCashBankAccount,
} from '../repositories/cash-banks.repository'
import type { CashBankAccountInput } from '../types/cash-banks.types'
import { saveCashBankAccount } from './cash-banks.service'

vi.mock('../repositories/cash-banks.repository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../repositories/cash-banks.repository')>()),
  checkDuplicateAccountName: vi.fn(),
  createCashBankAccount: vi.fn(),
  createCashBankAccountWithLedger: vi.fn(),
  updateCashBankAccount: vi.fn(),
}))

function input(overrides: Partial<CashBankAccountInput> = {}): CashBankAccountInput {
  return {
    ledgerMode: 'auto',
    ledgerAccountId: '',
    name: 'بنك جديد',
    kind: 'bank',
    bankName: 'New Bank',
    accountNumber: '123',
    iban: '',
    branchName: '',
    openingBalance: '500',
    currencyCode: 'EGP',
    isActive: true,
    ...overrides,
  }
}

describe('saveCashBankAccount creation mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkDuplicateAccountName).mockResolvedValue(false)
  })

  it('uses the atomic RPC path for automatic ledger creation', async () => {
    await saveCashBankAccount(input())

    expect(createCashBankAccountWithLedger).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'بنك جديد', account_kind: 'bank', opening_balance: 500 }),
    )
    expect(createCashBankAccount).not.toHaveBeenCalled()
  })

  it('keeps the existing-ledger creation path available', async () => {
    await saveCashBankAccount(input({ ledgerMode: 'existing', ledgerAccountId: 'ledger-1' }))

    expect(createCashBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({ ledger_account_id: 'ledger-1' }),
    )
    expect(createCashBankAccountWithLedger).not.toHaveBeenCalled()
  })

  it('does not replace the ledger account while editing', async () => {
    await saveCashBankAccount(input({ ledgerMode: 'existing', ledgerAccountId: 'ledger-1' }), 'cash-bank-1')

    expect(updateCashBankAccount).toHaveBeenCalledWith(
      'cash-bank-1',
      expect.not.objectContaining({ ledger_account_id: expect.anything() }),
    )
    expect(createCashBankAccountWithLedger).not.toHaveBeenCalled()
  })
})

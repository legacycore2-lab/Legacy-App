import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  accountHasFinancialReferences,
  deleteLinkedCashBankAccountByLedger,
  findLinkedCashBankAccountId,
  restoreDeletedAccount,
  saveAccount,
  saveAccountWithCashBank,
  setAccountActive,
  setAccountDeleted,
} from '../repositories/accounts.repository'
import type { Account, AccountInput } from '../types/accounts.types'
import { removeAccount, restoreAccount, toggleAccount, upsertAccount } from './accounts.service'

vi.mock('../repositories/accounts.repository', () => ({
  accountHasFinancialReferences: vi.fn(),
  deleteLinkedCashBankAccountByLedger: vi.fn(),
  findAccounts: vi.fn(),
  findLinkedCashBankAccountId: vi.fn(),
  restoreDeletedAccount: vi.fn(),
  saveAccount: vi.fn(),
  saveAccountWithCashBank: vi.fn(),
  setAccountActive: vi.fn(),
  setAccountDeleted: vi.fn(),
}))

const parent: Account = {
  id: 'parent',
  code: '1000',
  nameAr: 'الأصول',
  nameEn: 'Assets',
  accountType: 'asset',
  normalBalance: 'debit',
  parentId: null,
  level: 1,
  isPostable: false,
  isActive: true,
  deletedAt: null,
}

const child: Account = {
  ...parent,
  id: 'child',
  code: '1200',
  nameAr: 'العملاء',
  parentId: parent.id,
  level: 2,
  isPostable: true,
}

const cashBankParent: Account = {
  ...parent,
  id: 'cash-bank-parent',
  code: '1100',
  nameAr: 'النقدية والبنوك',
  parentId: parent.id,
  level: 2,
  isPostable: false,
}

const validInput: AccountInput = {
  code: ' 1200 ',
  nameAr: ' العملاء ',
  nameEn: ' Receivables ',
  accountType: 'asset',
  normalBalance: 'debit',
  parentId: parent.id,
  isPostable: true,
  isActive: true,
  cashBankKind: 'none',
}

describe('accounts service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(accountHasFinancialReferences).mockResolvedValue(false)
    vi.mocked(findLinkedCashBankAccountId).mockResolvedValue(null)
  })

  it('normalizes input and derives the hierarchy level', async () => {
    await upsertAccount(validInput, [parent])

    expect(saveAccount).toHaveBeenCalledWith(
      { ...validInput, code: '1200', nameAr: 'العملاء', nameEn: 'Receivables' },
      2,
    )
  })

  it('creates a linked operational account when bank or cash is selected', async () => {
    const input = {
      ...validInput,
      code: '1110',
      nameAr: 'CIB',
      nameEn: 'CIB',
      parentId: cashBankParent.id,
      cashBankKind: 'bank' as const,
    }

    await upsertAccount(input, [parent, cashBankParent])

    expect(saveAccountWithCashBank).toHaveBeenCalledWith(input)
    expect(saveAccount).not.toHaveBeenCalled()
  })

  it('rejects bank or cash creation outside the 1100 parent', async () => {
    await expect(upsertAccount({ ...validInput, cashBankKind: 'cash' }, [parent])).rejects.toThrow(
      'حسابات الخزنة والبنوك يجب إنشاؤها مباشرة تحت 1100 — النقدية والبنوك.',
    )
  })

  it('rejects duplicate account codes', async () => {
    await expect(upsertAccount({ ...validInput, code: parent.code }, [parent])).rejects.toThrow(
      'كود الحساب مستخدم بالفعل.',
    )
  })

  it('rejects a normal balance that conflicts with the account type', async () => {
    await expect(upsertAccount({ ...validInput, normalBalance: 'credit' }, [parent])).rejects.toThrow(
      'طبيعة الرصيد لا تتوافق مع نوع الحساب.',
    )
  })

  it('requires parent accounts to be active and non-postable', async () => {
    await expect(upsertAccount(validInput, [{ ...parent, isPostable: true }])).rejects.toThrow(
      'الحساب الرئيسي يجب أن يكون حسابًا تجميعيًا.',
    )
  })

  it('rejects cycles when moving an existing account', async () => {
    await expect(
      upsertAccount(
        {
          ...validInput,
          id: parent.id,
          code: parent.code,
          nameAr: parent.nameAr,
          nameEn: parent.nameEn,
          parentId: child.id,
        },
        [parent, child],
      ),
    ).rejects.toThrow('لا يمكن إنشاء دورة داخل شجرة الحسابات.')
  })

  it('does not allow an account with children to become postable', async () => {
    await expect(
      upsertAccount(
        {
          ...validInput,
          id: parent.id,
          code: parent.code,
          nameAr: parent.nameAr,
          nameEn: parent.nameEn,
          parentId: null,
        },
        [parent, child],
      ),
    ).rejects.toThrow('لا يمكن تحويل حساب رئيسي يحتوي على فروع إلى حساب قابل للترحيل.')
  })

  it('prevents deactivating a parent with active children', async () => {
    await expect(toggleAccount(parent.id, false, [parent, child])).rejects.toThrow(
      'أوقف الحسابات الفرعية النشطة أولًا.',
    )
  })

  it('updates an eligible account status through the repository', async () => {
    await toggleAccount(child.id, false, [parent, child])

    expect(setAccountActive).toHaveBeenCalledWith(child.id, false)
  })

  it('prevents deleting an account that still has children', async () => {
    await expect(removeAccount(parent.id, [parent, child])).rejects.toThrow(
      'لا يمكن حذف حساب يحتوي على حسابات فرعية. احذف أو انقل الفروع أولًا.',
    )
    expect(setAccountDeleted).not.toHaveBeenCalled()
  })

  it('deletes linked bank or cash from both modules through the atomic path', async () => {
    vi.mocked(findLinkedCashBankAccountId).mockResolvedValueOnce('cash-bank-1')

    await removeAccount(child.id, [parent, child])

    expect(deleteLinkedCashBankAccountByLedger).toHaveBeenCalledWith(child.id)
    expect(setAccountDeleted).not.toHaveBeenCalled()
  })

  it('prevents deleting an account referenced by financial data', async () => {
    vi.mocked(accountHasFinancialReferences).mockResolvedValueOnce(true)

    await expect(removeAccount(child.id, [parent, child])).rejects.toThrow(
      'لا يمكن حذف الحساب لأنه مستخدم في قيود أو مرتبط بالخزنة والبنوك. يمكنك إيقافه بدلًا من الحذف.',
    )
  })

  it('soft deletes an unused leaf account', async () => {
    await removeAccount(child.id, [parent, child])

    expect(setAccountDeleted).toHaveBeenCalledWith(child.id, true)
  })

  it('restores a deleted account when its parent is available', async () => {
    const deletedChild = { ...child, isActive: false, deletedAt: '2026-08-19T00:00:00.000Z' }

    await restoreAccount(deletedChild.id, [parent, deletedChild])

    expect(restoreDeletedAccount).toHaveBeenCalledWith(deletedChild.id, undefined)
    expect(setAccountDeleted).not.toHaveBeenCalled()
  })

  it('requires restoring a deleted parent before its child', async () => {
    const deletedParent = { ...parent, isActive: false, deletedAt: '2026-08-19T00:00:00.000Z' }
    const deletedChild = { ...child, isActive: false, deletedAt: '2026-08-19T00:00:00.000Z' }

    await expect(restoreAccount(deletedChild.id, [deletedParent, deletedChild])).rejects.toThrow(
      'استعد الحساب الرئيسي أولًا قبل استعادة هذا الحساب.',
    )
  })

  it('restores a cash/bank account using the stored kind', async () => {
    const deletedCashAccount: Account = {
      ...child,
      id: 'cash-1',
      code: '1100-001',
      parentId: cashBankParent.id,
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      isActive: false,
      deletedAt: '2026-08-19T00:00:00.000Z',
      cashBankKind: 'cash',
    }

    await restoreAccount(deletedCashAccount.id, [parent, cashBankParent, deletedCashAccount])

    expect(restoreDeletedAccount).toHaveBeenCalledWith(deletedCashAccount.id, 'cash')
    expect(setAccountDeleted).not.toHaveBeenCalled()
  })

  it('uses the caller-supplied kind when stored kind is none', async () => {
    const deletedBankAccount: Account = {
      ...child,
      id: 'bank-1',
      code: '1100-002',
      parentId: cashBankParent.id,
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      isActive: false,
      deletedAt: '2026-08-19T00:00:00.000Z',
      cashBankKind: 'none',
    }

    await restoreAccount(deletedBankAccount.id, [parent, cashBankParent, deletedBankAccount], 'bank')

    expect(restoreDeletedAccount).toHaveBeenCalledWith(deletedBankAccount.id, 'bank')
  })

  it('blocks cash/bank restore when no kind can be resolved', async () => {
    const deletedBankAccount: Account = {
      ...child,
      id: 'bank-2',
      code: '1100-003',
      parentId: cashBankParent.id,
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      isActive: false,
      deletedAt: '2026-08-19T00:00:00.000Z',
      cashBankKind: 'none',
    }

    await expect(
      restoreAccount(deletedBankAccount.id, [parent, cashBankParent, deletedBankAccount]),
    ).rejects.toThrow('حدد هل الحساب بنك أم خزنة قبل الاستعادة.')
  })
})

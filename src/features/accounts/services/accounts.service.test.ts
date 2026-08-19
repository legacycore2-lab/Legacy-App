import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  accountHasFinancialReferences,
  saveAccount,
  setAccountActive,
  setAccountDeleted,
} from '../repositories/accounts.repository'
import type { Account, AccountInput } from '../types/accounts.types'
import { removeAccount, restoreAccount, toggleAccount, upsertAccount } from './accounts.service'

vi.mock('../repositories/accounts.repository', () => ({
  accountHasFinancialReferences: vi.fn(),
  findAccounts: vi.fn(),
  saveAccount: vi.fn(),
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
  code: '1100',
  nameAr: 'النقدية',
  parentId: parent.id,
  level: 2,
  isPostable: true,
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
}

describe('accounts service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(accountHasFinancialReferences).mockResolvedValue(false)
  })

  it('normalizes input and derives the hierarchy level', async () => {
    await upsertAccount(validInput, [parent])

    expect(saveAccount).toHaveBeenCalledWith(
      { ...validInput, code: '1200', nameAr: 'العملاء', nameEn: 'Receivables' },
      2,
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
      upsertAccount({ ...validInput, id: parent.id, parentId: child.id }, [parent, child]),
    ).rejects.toThrow('لا يمكن إنشاء دورة داخل شجرة الحسابات.')
  })

  it('does not allow an account with children to become postable', async () => {
    await expect(
      upsertAccount({ ...validInput, id: parent.id, parentId: null }, [parent, child]),
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

    expect(setAccountDeleted).toHaveBeenCalledWith(deletedChild.id, false)
  })

  it('requires restoring a deleted parent before its child', async () => {
    const deletedParent = { ...parent, isActive: false, deletedAt: '2026-08-19T00:00:00.000Z' }
    const deletedChild = { ...child, isActive: false, deletedAt: '2026-08-19T00:00:00.000Z' }

    await expect(restoreAccount(deletedChild.id, [deletedParent, deletedChild])).rejects.toThrow(
      'استعد الحساب الرئيسي أولًا قبل استعادة هذا الحساب.',
    )
  })
})

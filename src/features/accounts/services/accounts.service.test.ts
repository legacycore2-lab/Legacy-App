import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveAccount, setAccountActive } from '../repositories/accounts.repository'
import type { Account, AccountInput } from '../types/accounts.types'
import { toggleAccount, upsertAccount } from './accounts.service'

vi.mock('../repositories/accounts.repository', () => ({
  findAccounts: vi.fn(),
  saveAccount: vi.fn(),
  setAccountActive: vi.fn(),
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
})

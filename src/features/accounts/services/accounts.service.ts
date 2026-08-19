import {
  accountHasFinancialReferences,
  deleteLinkedCashBankAccountByLedger,
  findAccounts,
  findLinkedCashBankAccountId,
  restoreDeletedAccount,
  saveAccount,
  saveAccountWithCashBank,
  setAccountActive,
  setAccountDeleted,
  subscribeToAccountChanges,
  type AccountRecord,
} from '../repositories/accounts.repository'
import { DataValidationError } from '../../../shared/errors/app-error'
import type {
  Account,
  AccountCashBankKind,
  AccountInput,
  AccountType,
  NormalBalance,
} from '../types/accounts.types'

const MAX_ACCOUNT_LEVEL = 10

function mapAccount(record: AccountRecord): Account {
  return {
    id: record.id,
    code: record.code,
    nameAr: record.name_ar,
    nameEn: record.name_en ?? '',
    accountType: record.account_type,
    normalBalance: record.normal_balance,
    parentId: record.parent_id,
    level: record.level,
    isPostable: record.is_postable,
    isActive: record.is_active,
    deletedAt: record.deleted_at,
    cashBankKind: record.cash_bank_kind ?? 'none',
  }
}

function expectedNormalBalance(accountType: AccountType): NormalBalance {
  return accountType === 'asset' || accountType === 'expense' ? 'debit' : 'credit'
}

function createsCycle(accountId: string, parentId: string, accounts: Account[]): boolean {
  const byId = new Map(accounts.map((account) => [account.id, account]))
  const visited = new Set<string>()
  let currentId: string | null = parentId

  while (currentId) {
    if (currentId === accountId) return true
    if (visited.has(currentId)) return true

    visited.add(currentId)
    currentId = byId.get(currentId)?.parentId ?? null
  }

  return false
}

function activeChildren(accountId: string, accounts: Account[]): Account[] {
  return accounts.filter(
    (account) => account.parentId === accountId && account.isActive && !account.deletedAt,
  )
}

function existingChildren(accountId: string, accounts: Account[]): Account[] {
  return accounts.filter((account) => account.parentId === accountId && !account.deletedAt)
}

export async function getAccounts(): Promise<Account[]> {
  return (await findAccounts()).map(mapAccount)
}

export async function upsertAccount(input: AccountInput, accounts: Account[]): Promise<void> {
  const code = input.code.trim()
  const nameAr = input.nameAr.trim()
  const nameEn = input.nameEn.trim()
  const cashBankKind = input.cashBankKind ?? 'none'

  if (!code || !nameAr) throw new DataValidationError('كود الحساب والاسم العربي مطلوبان.')
  if (input.normalBalance !== expectedNormalBalance(input.accountType)) {
    throw new DataValidationError('طبيعة الرصيد لا تتوافق مع نوع الحساب.')
  }

  if (input.id && accounts.find((account) => account.id === input.id)?.deletedAt) {
    throw new DataValidationError('لا يمكن تعديل حساب محذوف. استعد الحساب أولًا.')
  }

  const duplicate = accounts.some((account) => account.code === code && account.id !== input.id)
  if (duplicate) throw new DataValidationError('كود الحساب مستخدم بالفعل.')

  const parent = input.parentId
    ? accounts.find((account) => account.id === input.parentId)
    : undefined

  if (input.parentId && !parent) throw new DataValidationError('الحساب الرئيسي غير موجود.')
  if (parent?.deletedAt) throw new DataValidationError('لا يمكن الإضافة تحت حساب رئيسي محذوف.')
  if (input.id && input.parentId && createsCycle(input.id, input.parentId, accounts)) {
    throw new DataValidationError('لا يمكن إنشاء دورة داخل شجرة الحسابات.')
  }
  if (parent && !parent.isActive) {
    throw new DataValidationError('لا يمكن الإضافة تحت حساب رئيسي متوقف.')
  }
  if (parent?.isPostable) {
    throw new DataValidationError('الحساب الرئيسي يجب أن يكون حسابًا تجميعيًا.')
  }
  if (parent && parent.accountType !== input.accountType) {
    throw new DataValidationError('نوع الحساب الفرعي يجب أن يطابق الحساب الرئيسي.')
  }

  const level = parent ? parent.level + 1 : 1
  if (level > MAX_ACCOUNT_LEVEL) {
    throw new DataValidationError('تجاوز الحساب الحد الأقصى لمستويات الدليل.')
  }

  if (input.id && input.isPostable && existingChildren(input.id, accounts).length > 0) {
    throw new DataValidationError('لا يمكن تحويل حساب رئيسي يحتوي على فروع إلى حساب قابل للترحيل.')
  }
  if (input.id && !input.isActive && activeChildren(input.id, accounts).length > 0) {
    throw new DataValidationError('أوقف الحسابات الفرعية النشطة أولًا.')
  }

  if (!input.id && cashBankKind !== 'none') {
    if (cashBankKind !== 'cash' && cashBankKind !== 'bank') {
      throw new DataValidationError('نوع حساب الخزنة أو البنك غير صالح.')
    }
    if (input.accountType !== 'asset' || input.normalBalance !== 'debit' || !input.isPostable) {
      throw new DataValidationError('حسابات الخزنة والبنوك يجب أن تكون أصولًا قابلة للترحيل بطبيعة مدينة.')
    }
    if (!parent || parent.code !== '1100') {
      throw new DataValidationError('حسابات الخزنة والبنوك يجب إنشاؤها مباشرة تحت 1100 — النقدية والبنوك.')
    }
    await saveAccountWithCashBank({ ...input, code, nameAr, nameEn, cashBankKind })
    return
  }

  await saveAccount({ ...input, code, nameAr, nameEn }, level)
}

export async function toggleAccount(
  id: string,
  isActive: boolean,
  accounts: Account[],
): Promise<void> {
  const account = accounts.find((candidate) => candidate.id === id)
  if (!account) throw new DataValidationError('الحساب غير موجود.')
  if (account.deletedAt) throw new DataValidationError('لا يمكن تغيير حالة حساب محذوف.')

  if (!isActive && activeChildren(id, accounts).length > 0) {
    throw new DataValidationError('أوقف الحسابات الفرعية النشطة أولًا.')
  }

  await setAccountActive(id, isActive)
}

export async function removeAccount(id: string, accounts: Account[]): Promise<void> {
  const account = accounts.find((candidate) => candidate.id === id)
  if (!account) throw new DataValidationError('الحساب غير موجود.')
  if (account.deletedAt) throw new DataValidationError('الحساب محذوف بالفعل.')
  if (existingChildren(id, accounts).length > 0) {
    throw new DataValidationError('لا يمكن حذف حساب يحتوي على حسابات فرعية. احذف أو انقل الفروع أولًا.')
  }

  const linkedCashBankAccountId = await findLinkedCashBankAccountId(id)
  if (linkedCashBankAccountId) {
    await deleteLinkedCashBankAccountByLedger(id)
    return
  }

  if (await accountHasFinancialReferences(id)) {
    throw new DataValidationError(
      'لا يمكن حذف الحساب لأنه مستخدم في قيود أو مرتبط بالخزنة والبنوك. يمكنك إيقافه بدلًا من الحذف.',
    )
  }

  await setAccountDeleted(id, true)
}

export async function restoreAccount(
  id: string,
  accounts: Account[],
  cashBankKind?: AccountCashBankKind,
): Promise<void> {
  const account = accounts.find((candidate) => candidate.id === id)
  if (!account) throw new DataValidationError('الحساب غير موجود.')
  if (!account.deletedAt) throw new DataValidationError('الحساب غير محذوف.')

  const parent = account.parentId
    ? accounts.find((candidate) => candidate.id === account.parentId)
    : undefined
  if (account.parentId && (!parent || parent.deletedAt)) {
    throw new DataValidationError('استعد الحساب الرئيسي أولًا قبل استعادة هذا الحساب.')
  }

  const isCashBankCandidate =
    parent?.code === '1100' && account.accountType === 'asset' && account.isPostable
  const resolvedKind =
    account.cashBankKind !== 'none' ? account.cashBankKind : cashBankKind

  if (isCashBankCandidate && resolvedKind !== 'cash' && resolvedKind !== 'bank') {
    throw new DataValidationError('حدد هل الحساب بنك أم خزنة قبل الاستعادة.')
  }

  await restoreDeletedAccount(id, isCashBankCandidate ? resolvedKind : undefined)
}

export function watchAccounts(onChange: () => void): () => void {
  return subscribeToAccountChanges(onChange)
}

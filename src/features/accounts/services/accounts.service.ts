import {
  findAccounts,
  saveAccount,
  setAccountActive,
  subscribeToAccountChanges,
  type AccountRecord,
} from '../repositories/accounts.repository'
import type { Account, AccountInput, AccountType, NormalBalance } from '../types/accounts.types'

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
  return accounts.filter((account) => account.parentId === accountId && account.isActive)
}

export async function getAccounts(): Promise<Account[]> {
  return (await findAccounts()).map(mapAccount)
}

export async function upsertAccount(input: AccountInput, accounts: Account[]): Promise<void> {
  const code = input.code.trim()
  const nameAr = input.nameAr.trim()
  const nameEn = input.nameEn.trim()

  if (!code || !nameAr) throw new Error('كود الحساب والاسم العربي مطلوبان.')
  if (input.normalBalance !== expectedNormalBalance(input.accountType)) {
    throw new Error('طبيعة الرصيد لا تتوافق مع نوع الحساب.')
  }

  const duplicate = accounts.some((account) => account.code === code && account.id !== input.id)
  if (duplicate) throw new Error('كود الحساب مستخدم بالفعل.')

  const parent = input.parentId ? accounts.find((account) => account.id === input.parentId) : undefined

  if (input.parentId && !parent) throw new Error('الحساب الرئيسي غير موجود.')
  if (input.id && input.parentId && createsCycle(input.id, input.parentId, accounts)) {
    throw new Error('لا يمكن إنشاء دورة داخل شجرة الحسابات.')
  }
  if (parent && !parent.isActive) throw new Error('لا يمكن الإضافة تحت حساب رئيسي متوقف.')
  if (parent?.isPostable) throw new Error('الحساب الرئيسي يجب أن يكون حسابًا تجميعيًا.')
  if (parent && parent.accountType !== input.accountType) {
    throw new Error('نوع الحساب الفرعي يجب أن يطابق الحساب الرئيسي.')
  }

  const level = parent ? parent.level + 1 : 1
  if (level > MAX_ACCOUNT_LEVEL) throw new Error('تجاوز الحساب الحد الأقصى لمستويات الدليل.')

  if (input.id && input.isPostable && accounts.some((account) => account.parentId === input.id)) {
    throw new Error('لا يمكن تحويل حساب رئيسي يحتوي على فروع إلى حساب قابل للترحيل.')
  }
  if (input.id && !input.isActive && activeChildren(input.id, accounts).length > 0) {
    throw new Error('أوقف الحسابات الفرعية النشطة أولًا.')
  }

  await saveAccount({ ...input, code, nameAr, nameEn }, level)
}

export async function toggleAccount(id: string, isActive: boolean, accounts: Account[]): Promise<void> {
  const account = accounts.find((candidate) => candidate.id === id)
  if (!account) throw new Error('الحساب غير موجود.')

  if (!isActive && activeChildren(id, accounts).length > 0) {
    throw new Error('أوقف الحسابات الفرعية النشطة أولًا.')
  }

  await setAccountActive(id, isActive)
}

export function watchAccounts(onChange: () => void): () => void {
  return subscribeToAccountChanges(onChange)
}

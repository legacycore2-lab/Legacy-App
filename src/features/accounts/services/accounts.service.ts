import {
  findAccounts,
  saveAccount,
  setAccountActive,
  type AccountRecord,
} from '../repositories/accounts.repository'
import type { Account, AccountInput } from '../types/accounts.types'

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

export async function getAccounts(): Promise<Account[]> {
  return (await findAccounts()).map(mapAccount)
}

export async function upsertAccount(input: AccountInput, accounts: Account[]): Promise<void> {
  const code = input.code.trim()
  const nameAr = input.nameAr.trim()

  if (!code || !nameAr) throw new Error('كود الحساب والاسم العربي مطلوبان.')

  const duplicate = accounts.some((account) => account.code === code && account.id !== input.id)
  if (duplicate) throw new Error('كود الحساب مستخدم بالفعل.')

  const parent = input.parentId ? accounts.find((account) => account.id === input.parentId) : undefined

  if (input.parentId && !parent) throw new Error('الحساب الرئيسي غير موجود.')
  if (parent && parent.accountType !== input.accountType) {
    throw new Error('نوع الحساب الفرعي يجب أن يطابق الحساب الرئيسي.')
  }

  await saveAccount({ ...input, code, nameAr }, parent ? parent.level + 1 : 1)
}

export async function toggleAccount(id: string, isActive: boolean): Promise<void> {
  await setAccountActive(id, isActive)
}

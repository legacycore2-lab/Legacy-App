import { getSupabaseClient } from '../../../lib/supabase/client'
import type { AccountInput, AccountType, NormalBalance } from '../types/accounts.types'

export type AccountRecord = {
  id: string
  code: string
  name_ar: string
  name_en: string | null
  account_type: AccountType
  normal_balance: NormalBalance
  parent_id: string | null
  level: number
  is_postable: boolean
  is_active: boolean
}

export async function findAccounts(): Promise<AccountRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('accounts')
    .select(
      'id,code,name_ar,name_en,account_type,normal_balance,parent_id,level,is_postable,is_active',
    )
    .order('code')

  if (error) throw error
  return (data ?? []) as AccountRecord[]
}

export async function saveAccount(input: AccountInput, level: number): Promise<void> {
  const payload = {
    code: input.code,
    name_ar: input.nameAr,
    name_en: input.nameEn || null,
    account_type: input.accountType,
    normal_balance: input.normalBalance,
    parent_id: input.parentId,
    level,
    is_postable: input.isPostable,
    is_active: input.isActive,
  }

  const request = input.id
    ? getSupabaseClient().from('accounts').update(payload).eq('id', input.id)
    : getSupabaseClient().from('accounts').insert(payload)
  const { error } = await request

  if (error) throw error
}

export async function setAccountActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('accounts')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

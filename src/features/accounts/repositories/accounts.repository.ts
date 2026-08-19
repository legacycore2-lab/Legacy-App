import { getSupabaseClient } from '../../../lib/supabase/client'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
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
  deleted_at: string | null
}

export async function findAccounts(): Promise<AccountRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('accounts')
    .select(
      'id,code,name_ar,name_en,account_type,normal_balance,parent_id,level,is_postable,is_active,deleted_at',
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
  const { error } = await getSupabaseClient().from('accounts').update({ is_active: isActive }).eq('id', id)

  if (error) throw error
}

export async function setAccountDeleted(id: string, deleted: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('accounts')
    .update({ deleted_at: deleted ? new Date().toISOString() : null, is_active: deleted ? false : true })
    .eq('id', id)

  if (error) throw error
}

export async function accountHasFinancialReferences(id: string): Promise<boolean> {
  const client = getSupabaseClient()
  const [{ count: journalCount, error: journalError }, { count: cashBankCount, error: cashBankError }] =
    await Promise.all([
      client.from('journal_lines').select('id', { count: 'exact', head: true }).eq('account_id', id),
      client
        .from('cash_bank_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('ledger_account_id', id),
    ])

  if (journalError) throw journalError
  if (cashBankError) throw cashBankError
  return (journalCount ?? 0) > 0 || (cashBankCount ?? 0) > 0
}

export function subscribeToAccountChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('accounts', ['accounts'], onChange)
}

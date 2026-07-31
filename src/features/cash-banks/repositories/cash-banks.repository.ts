import { AppError } from '../../../shared/errors/app-error'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type { CashBankBalanceRow, CashBankTransactionRow } from '../types/cash-banks.types'

const TRANSACTION_FIELDS = [
  'id',
  'transaction_number',
  'transaction_date',
  'transaction_type',
  'source_account_id',
  'destination_account_id',
  'amount',
  'description',
  'reference_number',
  'status',
  'journal_id',
  'posted_at',
  'voided_at',
  'created_at',
  'updated_at',
] as const

export async function findCashBankBalances(): Promise<CashBankBalanceRow[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('cash_bank_account_balances')
    .select('*')
    .eq('is_active', true)
    .order('account_kind')
    .order('name')

  if (error) throw new AppError(error.message, 'CASH_BANK_BALANCES_FETCH_FAILED')
  return data ?? []
}

export async function findRecentCashBankTransactions(limit = 20): Promise<CashBankTransactionRow[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('cash_bank_transactions')
    .select(TRANSACTION_FIELDS.join(', '))
    .order('transaction_date', { ascending: false })
    .order('transaction_number', { ascending: false })
    .limit(limit)

  if (error) throw new AppError(error.message, 'CASH_BANK_TRANSACTIONS_FETCH_FAILED')
  return (data as unknown as CashBankTransactionRow[]) ?? []
}

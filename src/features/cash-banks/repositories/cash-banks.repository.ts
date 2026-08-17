import { AppError } from '../../../shared/errors/app-error'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type {
  CashBankAccountPayload,
  CashBankAccountRow,
  CashBankAccountUpdatePayload,
  CashBankBalanceRow,
  CashBankDepositAccountOption,
  CashBankDepositPayload,
  CashBankLedgerAccountOption,
  CashBankOffsetAccountOption,
  CashBankTransactionRow,
  CashBankTransactionTypeFilter,
  CashBankWithdrawalAccountOption,
  CashBankWithdrawalPayload,
  CashBankTransferAccountOption,
  CashBankTransferPayload,
  CashBankReversalPayload,
} from '../types/cash-banks.types'

type CashBankMovementsQuery = {
  offset: number
  limit: number
  accountId: string
  type: CashBankTransactionTypeFilter
  dateFrom: string
  dateTo: string
  query: string
}

const ACCOUNT_FIELDS =
  'id,ledger_account_id,name,account_kind,bank_name,account_number,iban,branch_name,opening_balance,currency_code,is_active,created_at,updated_at'

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
  'reversal_of_transaction_id',
] as const

export async function findCashBankBalances(): Promise<CashBankBalanceRow[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('cash_bank_account_balances')
    .select('*')
    // The management cards must include inactive accounts so an administrator
    // can open and reactivate them. Transaction forms apply their own active
    // filters and therefore remain protected from using inactive accounts.
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

export async function findCashBankTransactionPage(
  q: CashBankMovementsQuery,
): Promise<{ records: CashBankTransactionRow[]; totalCount: number }> {
  const supabase = getSupabaseClient()

  let request = supabase
    .from('cash_bank_transactions')
    .select(TRANSACTION_FIELDS.join(', '), { count: 'exact' })
    .order('transaction_date', { ascending: false })
    .order('transaction_number', { ascending: false })
    .range(q.offset, q.offset + q.limit - 1)

  if (q.accountId) {
    request = request.or(`source_account_id.eq.${q.accountId},destination_account_id.eq.${q.accountId}`)
  }
  if (q.type !== 'all') {
    request = request.eq('transaction_type', q.type)
  }
  if (q.dateFrom) {
    request = request.gte('transaction_date', q.dateFrom)
  }
  if (q.dateTo) {
    request = request.lte('transaction_date', q.dateTo)
  }
  if (q.query.trim()) {
    const pattern = `%${q.query.trim().replace(/[%_]/g, ' ')}%`
    request = request.or(`description.ilike.${pattern},reference_number.ilike.${pattern}`)
  }

  const { data, error, count } = await request

  if (error) throw new AppError(error.message, 'CASH_BANK_TRANSACTIONS_PAGE_FETCH_FAILED')
  return {
    records: (data as unknown as CashBankTransactionRow[]) ?? [],
    totalCount: count ?? 0,
  }
}

export async function findCashBankAccountById(id: string): Promise<CashBankAccountRow | null> {
  const { data, error } = await getSupabaseClient()
    .from('cash_bank_accounts')
    .select(ACCOUNT_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new AppError(error.message, 'CASH_BANK_ACCOUNT_FETCH_FAILED')
  return data as CashBankAccountRow | null
}

export async function findAvailableLedgerAccounts(): Promise<CashBankLedgerAccountOption[]> {
  const { data, error } = await getSupabaseClient()
    .from('accounts')
    .select('id,code,name_ar')
    .eq('account_type', 'asset')
    .eq('is_postable', true)
    .eq('is_active', true)
    .order('code')

  if (error) throw new AppError(error.message, 'CASH_BANK_LEDGER_ACCOUNTS_FETCH_FAILED')
  return (data ?? []).map((account) => ({ id: account.id, code: account.code, name: account.name_ar }))
}

export async function checkDuplicateAccountName(name: string, excludeId?: string): Promise<boolean> {
  let query = getSupabaseClient()
    .from('cash_bank_accounts')
    .select('id', { count: 'exact', head: true })
    .ilike('name', name)

  if (excludeId) query = query.neq('id', excludeId)
  const { count, error } = await query

  if (error) throw new AppError(error.message, 'CASH_BANK_ACCOUNT_DUPLICATE_CHECK_FAILED')
  return (count ?? 0) > 0
}

export async function createCashBankAccount(payload: CashBankAccountPayload): Promise<void> {
  const { error } = await getSupabaseClient().from('cash_bank_accounts').insert(payload)
  if (error) throw new AppError(error.message, 'CASH_BANK_ACCOUNT_CREATE_FAILED')
}

export async function createCashBankAccountWithLedger(
  payload: Omit<CashBankAccountPayload, 'ledger_account_id'>,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('create_cash_bank_account_with_ledger', {
    p_name: payload.name,
    p_account_kind: payload.account_kind,
    p_bank_name: payload.bank_name,
    p_account_number: payload.account_number,
    p_iban: payload.iban,
    p_branch_name: payload.branch_name,
    p_opening_balance: payload.opening_balance,
    p_currency_code: payload.currency_code,
    p_is_active: payload.is_active,
  })

  if (error) throw new AppError(error.message, 'CASH_BANK_ACCOUNT_ATOMIC_CREATE_FAILED')
}

export async function updateCashBankAccount(
  id: string,
  payload: CashBankAccountUpdatePayload,
): Promise<void> {
  const { error } = await getSupabaseClient().from('cash_bank_accounts').update(payload).eq('id', id)
  if (error) throw new AppError(error.message, 'CASH_BANK_ACCOUNT_UPDATE_FAILED')
}

export async function deactivateCashBankAccount(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('cash_bank_accounts')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new AppError(error.message, 'CASH_BANK_ACCOUNT_DEACTIVATE_FAILED')
}

export async function deleteUnusedCashBankAccount(id: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('delete_unused_cash_bank_account', {
    p_cash_bank_account_id: id,
  })

  if (error) throw new AppError(error.message, 'CASH_BANK_ACCOUNT_DELETE_FAILED')
}

export async function findDepositDestinationAccounts(): Promise<CashBankDepositAccountOption[]> {
  const { data, error } = await getSupabaseClient()
    .from('cash_bank_accounts')
    .select('id,ledger_account_id,name')
    .eq('is_active', true)
    .order('name')

  if (error) throw new AppError(error.message, 'CASH_BANK_DEPOSIT_ACCOUNTS_FETCH_FAILED')
  return (data ?? []).map((account) => ({
    id: account.id,
    ledgerAccountId: account.ledger_account_id,
    name: account.name,
  }))
}

export async function findDepositOffsetAccounts(): Promise<CashBankOffsetAccountOption[]> {
  const { data, error } = await getSupabaseClient()
    .from('accounts')
    .select('id,code,name_ar')
    .eq('is_active', true)
    .eq('is_postable', true)
    .order('code')

  if (error) throw new AppError(error.message, 'CASH_BANK_OFFSET_ACCOUNTS_FETCH_FAILED')
  return (data ?? []).map((account) => ({ id: account.id, code: account.code, name: account.name_ar }))
}

export async function postCashBankDeposit(payload: CashBankDepositPayload): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_cash_bank_deposit', {
    p_client_request_id: payload.clientRequestId,
    p_destination_account_id: payload.destinationAccountId,
    p_offset_account_id: payload.offsetAccountId,
    p_transaction_date: payload.transactionDate,
    p_amount: payload.amount,
    p_description: payload.description,
    p_reference_number: payload.referenceNumber,
  })

  if (error) throw new AppError(error.message, 'CASH_BANK_DEPOSIT_POST_FAILED')
  if (typeof data !== 'string')
    throw new AppError('Deposit did not return an identifier.', 'INVALID_DEPOSIT_ID')
  return data
}

export async function findWithdrawalSourceAccounts(): Promise<CashBankWithdrawalAccountOption[]> {
  const { data, error } = await getSupabaseClient()
    .from('cash_bank_account_balances')
    .select('id,ledger_account_id,name,current_balance')
    .eq('is_active', true)
    .order('name')

  if (error) throw new AppError(error.message, 'CASH_BANK_WITHDRAWAL_ACCOUNTS_FETCH_FAILED')
  return (data ?? []).map((account) => ({
    id: account.id,
    ledgerAccountId: account.ledger_account_id,
    name: account.name,
    currentBalance: Number(account.current_balance),
  }))
}

export async function postCashBankWithdrawal(payload: CashBankWithdrawalPayload): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_cash_bank_withdrawal', {
    p_client_request_id: payload.clientRequestId,
    p_source_account_id: payload.sourceAccountId,
    p_offset_account_id: payload.offsetAccountId,
    p_transaction_date: payload.transactionDate,
    p_amount: payload.amount,
    p_description: payload.description,
    p_reference_number: payload.referenceNumber,
  })

  if (error) throw new AppError(error.message, 'CASH_BANK_WITHDRAWAL_POST_FAILED')
  if (typeof data !== 'string')
    throw new AppError('Withdrawal did not return an identifier.', 'INVALID_WITHDRAWAL_ID')
  return data
}

export async function findTransferAccounts(): Promise<CashBankTransferAccountOption[]> {
  const { data, error } = await getSupabaseClient()
    .from('cash_bank_account_balances')
    .select('id,ledger_account_id,name,current_balance')
    .eq('is_active', true)
    .order('name')

  if (error) throw new AppError(error.message, 'CASH_BANK_TRANSFER_ACCOUNTS_FETCH_FAILED')
  return (data ?? []).map((account) => ({
    id: account.id,
    ledgerAccountId: account.ledger_account_id,
    name: account.name,
    currentBalance: Number(account.current_balance),
  }))
}

export async function postCashBankTransfer(payload: CashBankTransferPayload): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_cash_bank_transfer', {
    p_client_request_id: payload.clientRequestId,
    p_source_account_id: payload.sourceAccountId,
    p_destination_account_id: payload.destinationAccountId,
    p_transaction_date: payload.transactionDate,
    p_amount: payload.amount,
    p_description: payload.description,
    p_reference_number: payload.referenceNumber,
  })

  if (error) throw new AppError(error.message, 'CASH_BANK_TRANSFER_POST_FAILED')
  if (typeof data !== 'string')
    throw new AppError('Transfer did not return an identifier.', 'INVALID_TRANSFER_ID')
  return data
}

export async function postCashBankReversal(payload: CashBankReversalPayload): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('reverse_cash_bank_transaction', {
    p_client_request_id: payload.clientRequestId,
    p_transaction_id: payload.transactionId,
    p_reversal_date: payload.reversalDate,
    p_reason: payload.reason,
  })

  if (error) throw new AppError(error.message, 'CASH_BANK_REVERSAL_POST_FAILED')
  if (typeof data !== 'string')
    throw new AppError('Reversal did not return an identifier.', 'INVALID_REVERSAL_ID')
  return data
}

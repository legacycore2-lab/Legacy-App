import { AppError } from '../../../shared/errors/app-error'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type {
  AdvanceOptions,
  AdvanceRow,
  CreateAdvanceInput,
  RecordAdvanceExpenseInput,
  ReturnAdvanceInput,
} from '../types/advances.types'

const ADVANCE_FIELDS =
  'id,advance_number,advance_code,holder_name,holder_title,project_names,issue_date,due_date,purpose,amount,spent_amount,returned_amount'

export async function findAdvances(): Promise<AdvanceRow[]> {
  const { data, error } = await getSupabaseClient()
    .from('advances_overview')
    .select(ADVANCE_FIELDS)
    .order('issue_date', { ascending: false })

  if (error) throw new AppError(error.message, 'ADVANCES_FETCH_FAILED')
  return (data as AdvanceRow[] | null) ?? []
}

export async function findAdvanceOptions(): Promise<AdvanceOptions> {
  const client = getSupabaseClient()
  const [projects, cashAccounts, ledgerAccounts, expenseAccounts] = await Promise.all([
    client.from('projects').select('id,name').eq('is_archived', false).order('name'),
    client
      .from('cash_bank_account_balances')
      .select('id,name,ledger_account_id,current_balance')
      .eq('is_active', true)
      .order('name'),
    client
      .from('accounts')
      .select('id,code,name_ar')
      .eq('account_type', 'asset')
      .eq('is_postable', true)
      .eq('is_active', true)
      .order('code'),
    client
      .from('accounts')
      .select('id,code,name_ar')
      .eq('account_type', 'expense')
      .eq('is_postable', true)
      .eq('is_active', true)
      .order('code'),
  ])
  const failure = [projects.error, cashAccounts.error, ledgerAccounts.error, expenseAccounts.error].find(
    Boolean,
  )
  if (failure) throw new AppError(failure.message, 'ADVANCE_OPTIONS_FETCH_FAILED')
  return {
    projects: (projects.data ?? []).map((item) => ({ id: item.id, name: item.name })),
    cashAccounts: (cashAccounts.data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      ledgerAccountId: item.ledger_account_id,
      balance: Number(item.current_balance),
    })),
    ledgerAccounts: (ledgerAccounts.data ?? []).map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name_ar,
    })),
    expenseAccounts: (expenseAccounts.data ?? []).map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name_ar,
    })),
  }
}

export async function postAdvance(input: CreateAdvanceInput, clientRequestId: string): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_advance', {
    p_client_request_id: clientRequestId,
    p_holder_name: input.holderName,
    p_holder_title: input.holderTitle || null,
    p_project_ids: input.projectIds,
    p_source_account_id: input.sourceAccountId,
    p_advance_ledger_account_id: input.advanceLedgerAccountId,
    p_issue_date: input.issueDate,
    p_due_date: input.dueDate || null,
    p_purpose: input.purpose,
    p_amount: Number(input.amount),
  })
  if (error) throw new AppError(error.message, 'ADVANCE_POST_FAILED')
  return data as string
}

export async function postAdvanceExpense(
  input: RecordAdvanceExpenseInput,
  clientRequestId: string,
): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_advance_expense', {
    p_client_request_id: clientRequestId,
    p_advance_id: input.advanceId,
    p_project_id: input.projectId,
    p_expense_account_id: input.expenseAccountId,
    p_transaction_date: input.transactionDate,
    p_description: input.description,
    p_amount: Number(input.amount),
  })
  if (error) throw new AppError(error.message, 'ADVANCE_EXPENSE_POST_FAILED')
  return data as string
}

export async function postAdvanceReturn(input: ReturnAdvanceInput, clientRequestId: string): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_advance_return', {
    p_client_request_id: clientRequestId,
    p_advance_id: input.advanceId,
    p_destination_account_id: input.destinationAccountId,
    p_transaction_date: input.transactionDate,
    p_description: input.description,
    p_amount: Number(input.amount),
  })
  if (error) throw new AppError(error.message, 'ADVANCE_RETURN_POST_FAILED')
  return data as string
}

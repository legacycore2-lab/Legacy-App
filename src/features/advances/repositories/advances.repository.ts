import { AppError } from '../../../shared/errors/app-error'
import { getSupabaseClient } from '../../../lib/supabase/client'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import type {
  AdvanceOptions,
  AdvanceRow,
  AdvanceTransactionRow,
  CreateAdvanceInput,
  RecordAdvanceExpenseInput,
  ReturnAdvanceInput,
} from '../types/advances.types'

const ADVANCE_FIELDS =
  'id,advance_number,advance_code,holder_name,holder_title,project_names,issue_date,due_date,purpose,amount,spent_amount,returned_amount'

const TRANSACTION_FIELDS =
  'id,advance_id,transaction_type,project_id,transaction_date,amount,description,source_record_id,created_at'

const ADVANCE_LEDGER_ACCOUNT_CODE = '1200'
const ADVANCE_LEDGER_ACCOUNT_NAME_AR = 'عوهد الموظفين'

type AdvancesQuery = {
  offset: number
  limit: number
  search: string
  project: string
  dateFrom: string
  dateTo: string
}

type AdvanceTransactionsQuery = {
  advanceId: string
  offset: number
  limit: number
}

const sanitizedSearch = (value: string) => value.trim().replace(/[,%_()]/g, ' ')

function applyAdvanceFilters<T>(request: T, q: Omit<AdvancesQuery, 'offset' | 'limit'>): T {
  let filtered = request as T & {
    or: (value: string) => T
    contains: (column: string, value: unknown[]) => T
    gte: (column: string, value: string) => T
    lte: (column: string, value: string) => T
  }
  const search = sanitizedSearch(q.search)
  if (search) {
    filtered = filtered.or(
      `holder_name.ilike.%${search}%,holder_title.ilike.%${search}%,advance_code.ilike.%${search}%,purpose.ilike.%${search}%`,
    ) as typeof filtered
  }
  if (q.project !== 'all') filtered = filtered.contains('project_names', [q.project]) as typeof filtered
  if (q.dateFrom) filtered = filtered.gte('issue_date', q.dateFrom) as typeof filtered
  if (q.dateTo) filtered = filtered.lte('issue_date', q.dateTo) as typeof filtered
  return filtered
}

async function ensureAdvanceLedgerAccountId(): Promise<string> {
  const client = getSupabaseClient()
  const { data: existing, error: existingError } = await client
    .from('accounts')
    .select('id,name_ar,account_type,is_postable,is_active,deleted_at')
    .eq('code', ADVANCE_LEDGER_ACCOUNT_CODE)
    .maybeSingle()

  if (existingError) throw new AppError(existingError.message, 'ADVANCE_LEDGER_LOOKUP_FAILED')

  if (existing) {
    if (
      existing.name_ar !== ADVANCE_LEDGER_ACCOUNT_NAME_AR ||
      existing.account_type !== 'asset' ||
      !existing.is_postable ||
      !existing.is_active ||
      existing.deleted_at
    ) {
      throw new AppError(
        `الحساب ${ADVANCE_LEDGER_ACCOUNT_CODE} مستخدم بالفعل ولا يصلح كحساب ${ADVANCE_LEDGER_ACCOUNT_NAME_AR}.`,
        'ADVANCE_LEDGER_ACCOUNT_CONFLICT',
      )
    }
    return existing.id
  }

  const { data: assetRoot, error: assetRootError } = await client
    .from('accounts')
    .select('id')
    .eq('code', '1000')
    .eq('account_type', 'asset')
    .eq('is_active', true)
    .maybeSingle()

  if (assetRootError) {
    throw new AppError(assetRootError.message, 'ADVANCE_LEDGER_PARENT_LOOKUP_FAILED')
  }
  if (!assetRoot) {
    throw new AppError(
      'حساب الأصول الرئيسي غير موجود. لا يمكن تجهيز حساب العوهد تلقائيًا.',
      'ADVANCE_LEDGER_PARENT_MISSING',
    )
  }

  const { data: created, error: createError } = await client
    .from('accounts')
    .insert({
      code: ADVANCE_LEDGER_ACCOUNT_CODE,
      name_ar: ADVANCE_LEDGER_ACCOUNT_NAME_AR,
      name_en: 'Employee Advances',
      account_type: 'asset',
      normal_balance: 'debit',
      parent_id: assetRoot.id,
      level: 2,
      is_postable: true,
      is_active: true,
    })
    .select('id')
    .single()

  if (createError) throw new AppError(createError.message, 'ADVANCE_LEDGER_CREATE_FAILED')
  return created.id
}

export async function findAdvances(): Promise<AdvanceRow[]> {
  return fetchAllWithPagination<AdvanceRow>((from, to) =>
    getSupabaseClient()
      .from('advances_overview')
      .select(ADVANCE_FIELDS)
      .order('issue_date', { ascending: false })
      .order('advance_number', { ascending: false })
      .range(from, to),
  )
}

export async function findAdvancesPage(
  q: AdvancesQuery,
): Promise<{ records: AdvanceRow[]; totalCount: number }> {
  let request = getSupabaseClient()
    .from('advances_overview')
    .select(ADVANCE_FIELDS, { count: 'exact' })
    .order('issue_date', { ascending: false })
    .order('advance_number', { ascending: false })

  request = applyAdvanceFilters(request, q)

  const { data, error, count } = await request.range(q.offset, q.offset + q.limit - 1)

  if (error) throw new AppError(error.message, 'ADVANCES_PAGE_FETCH_FAILED')
  return { records: (data as AdvanceRow[] | null) ?? [], totalCount: count ?? 0 }
}

export async function findAdvancesForStatusFilter(
  q: Omit<AdvancesQuery, 'offset' | 'limit'>,
): Promise<AdvanceRow[]> {
  return fetchAllWithPagination<AdvanceRow>((from, to) => {
    let request = getSupabaseClient()
      .from('advances_overview')
      .select(ADVANCE_FIELDS)
      .order('issue_date', { ascending: false })
      .order('advance_number', { ascending: false })

    request = applyAdvanceFilters(request, q)
    return request.range(from, to)
  })
}

export async function findAdvanceTransactions(
  q: AdvanceTransactionsQuery,
): Promise<{ records: AdvanceTransactionRow[]; totalCount: number }> {
  const { data, error, count } = await getSupabaseClient()
    .from('advance_transactions')
    .select(`${TRANSACTION_FIELDS},projects(name)`, { count: 'exact' })
    .eq('advance_id', q.advanceId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(q.offset, q.offset + q.limit - 1)

  if (error) throw new AppError(error.message, 'ADVANCE_TRANSACTIONS_FETCH_FAILED')

  const records: AdvanceTransactionRow[] = ((data as unknown as Array<Record<string, unknown>>) ?? []).map(
    (row) => ({
      id: row.id as string,
      advance_id: row.advance_id as string,
      transaction_type: row.transaction_type as AdvanceTransactionRow['transaction_type'],
      project_id: (row.project_id as string | null) ?? null,
      transaction_date: row.transaction_date as string,
      amount: Number(row.amount),
      description: row.description as string,
      source_record_id: row.source_record_id as string,
      created_at: row.created_at as string,
      project_name:
        row.projects && typeof row.projects === 'object' && !Array.isArray(row.projects)
          ? (((row.projects as Record<string, unknown>).name as string | null) ?? null)
          : Array.isArray(row.projects) && (row.projects as unknown[]).length > 0
            ? (((row.projects as Record<string, unknown>[])[0].name as string | null) ?? null)
            : null,
    }),
  )

  return { records, totalCount: count ?? 0 }
}

export async function findAdvanceOptions(): Promise<AdvanceOptions> {
  const client = getSupabaseClient()
  const [projects, cashAccounts, expenseAccounts] = await Promise.all([
    client.from('projects').select('id,name').eq('is_archived', false).order('name'),
    client
      .from('cash_bank_account_balances')
      .select('id,name,ledger_account_id,current_balance')
      .eq('is_active', true)
      .order('name'),
    client
      .from('accounts')
      .select('id,code,name_ar')
      .eq('account_type', 'expense')
      .eq('is_postable', true)
      .eq('is_active', true)
      .order('code'),
  ])
  const failure = [projects.error, cashAccounts.error, expenseAccounts.error].find(Boolean)
  if (failure) throw new AppError(failure.message, 'ADVANCE_OPTIONS_FETCH_FAILED')
  return {
    projects: (projects.data ?? []).map((item) => ({ id: item.id, name: item.name })),
    cashAccounts: (cashAccounts.data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      ledgerAccountId: item.ledger_account_id,
      balance: Number(item.current_balance),
    })),
    expenseAccounts: (expenseAccounts.data ?? []).map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name_ar,
    })),
  }
}

export async function postAdvance(input: CreateAdvanceInput, clientRequestId: string): Promise<string> {
  const advanceLedgerAccountId = await ensureAdvanceLedgerAccountId()
  const { data, error } = await getSupabaseClient().rpc('post_advance', {
    p_client_request_id: clientRequestId,
    p_holder_name: input.holderName,
    p_holder_title: input.holderTitle || null,
    p_project_ids: input.projectIds,
    p_source_account_id: input.sourceAccountId,
    p_advance_ledger_account_id: advanceLedgerAccountId,
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

export function subscribeToAdvanceChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('advances', ['advances', 'advance_transactions'], onChange)
}

export function subscribeToAdvanceOptionChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('advance-options', ['projects', 'accounts', 'cash_bank_accounts'], onChange)
}

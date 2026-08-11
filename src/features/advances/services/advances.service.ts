import {
  findAdvanceOptions,
  findAdvances,
  findAdvancesForStatusFilter,
  findAdvancesPage,
  findAdvanceTransactions,
  postAdvance,
  postAdvanceExpense,
  postAdvanceReturn,
} from '../repositories/advances.repository'
import type {
  Advance,
  AdvanceFilters,
  AdvanceRow,
  AdvancesMeta,
  AdvancesPage,
  AdvancesPageRequest,
  AdvancesSummary,
  AdvancesViewModel,
  AdvanceTransaction,
  AdvanceTransactionRow,
  AdvanceTransactionsPage,
  CreateAdvanceInput,
  RecordAdvanceExpenseInput,
  ReturnAdvanceInput,
} from '../types/advances.types'

export const ADVANCES_PAGE_SIZE = 25
export const ADVANCE_TRANSACTIONS_PAGE_SIZE = 20

export function mapAdvance(row: AdvanceRow, today = new Date()): Advance {
  const amount = Number(row.amount)
  const spent = Number(row.spent_amount)
  const returned = Number(row.returned_amount)
  const remaining = Math.max(0, amount - spent - returned)
  const settled = remaining === 0
  const overdue = !settled && Boolean(row.due_date) && new Date(`${row.due_date}T23:59:59`) < today

  return {
    id: row.id,
    number: row.advance_code,
    holderName: row.holder_name,
    holderTitle: row.holder_title ?? 'موظف',
    projectNames: row.project_names?.length ? row.project_names : ['بدون مشروع'],
    issueDate: row.issue_date,
    dueDate: row.due_date ?? '',
    purpose: row.purpose,
    amount,
    spent,
    returned,
    remaining,
    progress: amount > 0 ? Math.min(100, Math.round(((spent + returned) / amount) * 100)) : 0,
    status: settled ? 'settled' : overdue ? 'overdue' : 'open',
  }
}

export function mapAdvanceTransaction(row: AdvanceTransactionRow): AdvanceTransaction {
  return {
    id: row.id,
    type: row.transaction_type,
    date: row.transaction_date,
    projectName: row.project_name ?? null,
    description: row.description,
    amount: Number(row.amount),
    sourceRecordId: row.source_record_id,
  }
}

export function filterAdvances(advances: Advance[], filters: AdvanceFilters): Advance[] {
  return advances.filter((advance) => {
    const matchesStatus = filters.status === 'all' || advance.status === filters.status
    const matchesProject = filters.project === 'all' || advance.projectNames.includes(filters.project)
    return matchesStatus && matchesProject
  })
}

export function summarizeAdvances(advances: Advance[]): AdvancesSummary {
  return advances.reduce<AdvancesSummary>(
    (summary, advance) => ({
      openCount: summary.openCount + (advance.status !== 'settled' ? 1 : 0),
      totalSpent: summary.totalSpent + advance.spent,
      totalRemaining: summary.totalRemaining + advance.remaining,
      overdueCount: summary.overdueCount + (advance.status === 'overdue' ? 1 : 0),
    }),
    { openCount: 0, totalSpent: 0, totalRemaining: 0, overdueCount: 0 },
  )
}

export async function getAdvancesViewModel(filters: AdvanceFilters): Promise<AdvancesViewModel> {
  const advances = (await findAdvances()).map((row) => mapAdvance(row))
  return {
    advances,
    filteredAdvances: filterAdvances(advances, filters),
    projects: [...new Set(advances.flatMap((advance) => advance.projectNames))].sort((a, b) =>
      a.localeCompare(b, 'ar'),
    ),
    summary: summarizeAdvances(advances),
  }
}

export async function getAdvancesMeta(): Promise<AdvancesMeta> {
  const advances = (await findAdvances()).map((row) => mapAdvance(row))
  return {
    projects: [...new Set(advances.flatMap((advance) => advance.projectNames))].sort((a, b) =>
      a.localeCompare(b, 'ar'),
    ),
    summary: summarizeAdvances(advances),
  }
}

export async function getAdvancesPage(request: AdvancesPageRequest): Promise<AdvancesPage> {
  const pageSize = Math.min(Math.max(Math.trunc(request.pageSize), 1), 100)
  const page = Math.max(1, Math.trunc(request.page))
  const offset = (page - 1) * pageSize
  const repositoryFilters = {
    search: request.filters.search,
    project: request.filters.project,
    dateFrom: request.filters.dateFrom,
    dateTo: request.filters.dateTo,
  }

  if (request.filters.status !== 'all') {
    const records = await findAdvancesForStatusFilter(repositoryFilters)
    const filtered = filterAdvances(
      records.map((row) => mapAdvance(row)),
      request.filters,
    )
    const totalCount = filtered.length
    const paged = filtered.slice(offset, offset + pageSize)

    return {
      advances: paged,
      filteredAdvances: paged,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      totalCount,
    }
  }

  const { records, totalCount } = await findAdvancesPage({
    offset,
    limit: pageSize,
    ...repositoryFilters,
  })
  const advances = records.map((row) => mapAdvance(row))

  return {
    advances,
    filteredAdvances: advances,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    totalCount,
  }
}

export async function getAdvanceTransactionsPage(
  advanceId: string,
  page: number,
): Promise<AdvanceTransactionsPage> {
  const pageSize = ADVANCE_TRANSACTIONS_PAGE_SIZE
  const safePage = Math.max(1, Math.trunc(page))
  const offset = (safePage - 1) * pageSize

  const { records, totalCount } = await findAdvanceTransactions({
    advanceId,
    offset,
    limit: pageSize,
  })

  return {
    transactions: records.map(mapAdvanceTransaction),
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    totalCount,
  }
}

export const getAdvanceOptions = findAdvanceOptions

const positiveAmount = (value: string) => Number.isFinite(Number(value)) && Number(value) > 0

export async function createAdvance(input: CreateAdvanceInput, clientRequestId: string): Promise<string> {
  if (!input.holderName.trim()) throw new Error('اسم حامل العهدة مطلوب.')
  if (input.projectIds.length === 0) throw new Error('اختر مشروعًا واحدًا على الأقل.')
  if (!input.sourceAccountId || !input.advanceLedgerAccountId)
    throw new Error('حساب الصرف وحساب العهدة مطلوبان.')
  if (!input.issueDate || !input.purpose.trim()) throw new Error('تاريخ الصرف والغرض مطلوبان.')
  if (!positiveAmount(input.amount)) throw new Error('المبلغ يجب أن يكون أكبر من صفر.')
  if (!clientRequestId) throw new Error('معرّف الطلب مطلوب.')
  return postAdvance(input, clientRequestId)
}

export async function recordAdvanceExpense(
  input: RecordAdvanceExpenseInput,
  remaining: number,
  clientRequestId: string,
): Promise<string> {
  if (!input.projectId || !input.expenseAccountId || !input.transactionDate || !input.description.trim())
    throw new Error('أكمل بيانات المصروف.')
  if (!positiveAmount(input.amount) || Number(input.amount) > remaining)
    throw new Error('مبلغ المصروف غير صالح أو أكبر من المتبقي.')
  if (!clientRequestId) throw new Error('معرّف الطلب مطلوب.')
  return postAdvanceExpense(input, clientRequestId)
}

export async function returnAdvanceAmount(
  input: ReturnAdvanceInput,
  remaining: number,
  clientRequestId: string,
): Promise<string> {
  if (!input.destinationAccountId || !input.transactionDate || !input.description.trim())
    throw new Error('أكمل بيانات رد المبلغ.')
  if (!positiveAmount(input.amount) || Number(input.amount) > remaining)
    throw new Error('المبلغ المرتجع غير صالح أو أكبر من المتبقي.')
  if (!clientRequestId) throw new Error('معرّف الطلب مطلوب.')
  return postAdvanceReturn(input, clientRequestId)
}

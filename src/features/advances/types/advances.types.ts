export type AdvanceStatus = 'open' | 'overdue' | 'settled'

export interface AdvanceRow {
  id: string
  advance_number: number
  advance_code: string
  holder_name: string
  holder_title: string | null
  project_names: string[] | null
  issue_date: string
  due_date: string | null
  purpose: string
  amount: number
  spent_amount: number
  returned_amount: number
}

export interface Advance {
  id: string
  number: string
  holderName: string
  holderTitle: string
  projectNames: string[]
  issueDate: string
  dueDate: string
  purpose: string
  amount: number
  spent: number
  returned: number
  remaining: number
  progress: number
  status: AdvanceStatus
}

export interface AdvanceFilters {
  search: string
  status: 'all' | AdvanceStatus
  project: string
  dateFrom: string
  dateTo: string
}

export interface AdvancesPageRequest {
  page: number
  pageSize: number
  filters: AdvanceFilters
}

export interface AdvancesPage {
  advances: Advance[]
  filteredAdvances: Advance[]
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

export interface AdvancesMeta {
  projects: string[]
  summary: AdvancesSummary
}

export type AdvanceTransactionType = 'expense' | 'return'

export interface AdvanceTransactionRow {
  id: string
  advance_id: string
  transaction_type: AdvanceTransactionType
  project_id: string | null
  transaction_date: string
  amount: number
  description: string
  source_record_id: string
  created_at: string
  project_name: string | null
}

export interface AdvanceTransaction {
  id: string
  type: AdvanceTransactionType
  date: string
  projectName: string | null
  description: string
  amount: number
  sourceRecordId: string
}

export interface AdvanceTransactionsPage {
  transactions: AdvanceTransaction[]
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

export interface AdvancesSummary {
  openCount: number
  totalSpent: number
  totalRemaining: number
  overdueCount: number
}

/** @deprecated use AdvancesPage — retained for internal service use only */
export interface AdvancesViewModel {
  advances: Advance[]
  filteredAdvances: Advance[]
  projects: string[]
  summary: AdvancesSummary
}

export interface AdvanceProjectOption {
  id: string
  name: string
}
export interface AdvanceAccountOption {
  id: string
  name: string
  ledgerAccountId: string
  balance?: number
}
export interface AdvanceLedgerOption {
  id: string
  code: string
  name: string
}
export interface AdvanceOptions {
  projects: AdvanceProjectOption[]
  cashAccounts: AdvanceAccountOption[]
  expenseAccounts: AdvanceLedgerOption[]
}

export interface CreateAdvanceInput {
  holderName: string
  holderTitle: string
  projectIds: string[]
  sourceAccountId: string
  issueDate: string
  dueDate: string
  purpose: string
  amount: string
}
export interface RecordAdvanceExpenseInput {
  advanceId: string
  projectId: string
  expenseAccountId: string
  transactionDate: string
  description: string
  amount: string
}
export interface ReturnAdvanceInput {
  advanceId: string
  destinationAccountId: string
  transactionDate: string
  description: string
  amount: string
}

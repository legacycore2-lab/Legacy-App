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
}

export interface AdvancesSummary {
  openCount: number
  totalSpent: number
  totalRemaining: number
  overdueCount: number
}

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
  ledgerAccounts: AdvanceLedgerOption[]
  expenseAccounts: AdvanceLedgerOption[]
}

export interface CreateAdvanceInput {
  holderName: string
  holderTitle: string
  projectIds: string[]
  sourceAccountId: string
  advanceLedgerAccountId: string
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

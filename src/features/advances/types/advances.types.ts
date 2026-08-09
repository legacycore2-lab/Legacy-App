export type AdvanceStatus = 'open' | 'overdue' | 'settled'

export interface AdvanceRow {
  id: string
  advance_number: number
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

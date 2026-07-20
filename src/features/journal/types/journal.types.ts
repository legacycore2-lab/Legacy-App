export type JournalEntryType = 'income' | 'expense'

export type JournalEntry = {
  id: string
  sequence: number
  entryDate: string
  projectName: string
  type: JournalEntryType
  category: string
  description: string
  contractor: string
  paymentMethod: string
  amount: number
}

export type JournalFilters = {
  query: string
  type: 'all' | JournalEntryType
}

export type JournalPageRequest = {
  page: number
  pageSize: number
  filters: JournalFilters
  projectId?: string
}

export type JournalSummary = {
  totalCount: number
  pageIncome: number
  pageExpense: number
  pageNet: number
}

export type JournalPageResult = {
  entries: JournalEntry[]
  page: number
  pageSize: number
  totalPages: number
  summary: JournalSummary
}

export type JournalProjectHeader = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'archived'
}

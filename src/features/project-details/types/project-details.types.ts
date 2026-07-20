export type ProjectStatus = 'active' | 'completed' | 'archived'

export type ProjectDetails = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: ProjectStatus
}

export type ProjectEntryType = 'income' | 'expense'

export type ProjectEntry = {
  id: string
  sequence: number
  entryDate: string
  projectName: string
  type: ProjectEntryType
  category: string
  description: string
  contractor: string
  paymentMethod: string
  amount: number
}

export type ProjectEntryFilters = {
  query: string
  type: 'all' | ProjectEntryType
}

export type ProjectEntrySummary = {
  totalCount: number
  pageIncome: number
  pageExpense: number
  pageNet: number
}

export type ProjectEntriesPage = {
  entries: ProjectEntry[]
  page: number
  pageSize: number
  totalPages: number
  summary: ProjectEntrySummary
}

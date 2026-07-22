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
  isReversal: boolean
}

export type JournalFilters = {
  query: string
  type: 'all' | JournalEntryType
}

export type JournalPageRequest = {
  page: number
  pageSize: number
  filters: JournalFilters
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

export type JournalLineDetails = {
  id: string
  lineNumber: number
  accountCode: string
  accountName: string
  description: string
  debit: number
  credit: number
}

export type JournalDetails = {
  id: string
  journalNumber: number
  journalDate: string
  description: string
  status: 'draft' | 'posted' | 'reversed'
  projectName: string
  createdAt: string
  postedAt: string
  lines: JournalLineDetails[]
  totalDebit: number
  totalCredit: number
}

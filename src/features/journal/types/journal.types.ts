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

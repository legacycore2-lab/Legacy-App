import type { JournalEntryType } from './journal.types'

export type SingleLineJournalInput = {
  entryDate: string
  projectName: string
  type: JournalEntryType
  category: string
  description: string
  contractor: string
  paymentAccount: string
  amount: string
}

export type JournalPostingPreview = {
  debitAccount: string
  creditAccount: string
  amount: number
}

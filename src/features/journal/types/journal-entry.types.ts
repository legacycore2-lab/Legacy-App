import type { JournalEntryType } from './journal.types'

export type SingleLineJournalInput = {
  requestId: string
  entryDate: string
  projectId: string
  projectName: string
  type: JournalEntryType
  categoryAccountId: string
  category: string
  description: string
  contractor: string
  paymentAccountId: string
  paymentAccount: string
  amount: string
}

export type JournalPostingProjectOption = {
  id: string
  name: string
}

export type JournalPostingAccountOption = {
  id: string
  code: string
  name: string
  accountType: 'asset' | 'revenue' | 'expense'
}

export type JournalPostingOptions = {
  projects: JournalPostingProjectOption[]
  accounts: JournalPostingAccountOption[]
}

export type JournalPostingPreview = {
  debitAccount: string
  creditAccount: string
  amount: number
}

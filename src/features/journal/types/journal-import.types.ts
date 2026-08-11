import type { JournalEntryType } from './journal.types'

export type JournalImportStatus = 'valid' | 'invalid'

export type JournalImportRow = {
  requestId: string
  excelRow: number
  project: string
  projectId: string | null
  date: string
  type: JournalEntryType | null
  category: string
  categoryAccountId: string | null
  description: string
  contractor: string
  paymentMethod: string
  paymentAccountId: string | null
  amount: number | null
  notes: string
  status: JournalImportStatus
  errors: string[]
}

export type JournalImportPreview = {
  fileName: string
  rows: JournalImportRow[]
  totalRows: number
  validRows: number
  invalidRows: number
  canImport: boolean
}

export type JournalImportLimits = {
  maxFileSizeBytes: number
  maxRows: number
}

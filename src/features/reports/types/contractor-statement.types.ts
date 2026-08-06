import type { ContractorReportEntry } from './contractor-reports.types'

export type ContractorStatementPayment = {
  id: string
  entryNumber: number | null
  entryDate: string
  projectId: string
  projectName: string
  category: string
  description: string
  paymentMethod: string
  amount: number
  runningBalance: number
}

export type ContractorStatementSummary = {
  contractorName: string
  totalPayments: number
  paymentCount: number
  projectCount: number
  averagePayment: number
  firstPaymentDate: string | null
  lastPaymentDate: string | null
  currentBalance: number
}

export type ContractorStatementViewModel = {
  summary: ContractorStatementSummary
  payments: ContractorStatementPayment[]
}

export type ContractorStatementSourceEntry = Pick<
  ContractorReportEntry,
  | 'id'
  | 'entryNumber'
  | 'entryDate'
  | 'entryType'
  | 'amount'
  | 'contractorName'
  | 'projectId'
  | 'projectName'
  | 'category'
  | 'description'
  | 'paymentMethod'
>

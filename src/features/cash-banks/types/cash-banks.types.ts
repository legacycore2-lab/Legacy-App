export type CashBankMetricTone = 'green' | 'blue' | 'gold' | 'purple'
export type CashBankAccountKind = 'cash' | 'bank'
export type CashBankMovementKind = 'deposit' | 'withdrawal' | 'transfer' | 'expense'
export type CashBankMovementStatus = 'completed' | 'pending'

export interface CashBankMetric {
  id: string
  label: string
  value: string
  change: string
  tone: CashBankMetricTone
}

export interface CashBankAccount {
  id: string
  name: string
  kind: CashBankAccountKind
  balance: string
  progress: number
  tone: CashBankMetricTone
}

export interface CashBankMovement {
  id: string
  number: string
  date: string
  time: string
  account: string
  kind: CashBankMovementKind
  amount: string
  balanceAfter: string
  status: CashBankMovementStatus
}

export interface CashFlowPoint {
  month: string
  income: number
  expense: number
}

export interface CashBanksViewModel {
  asOfDate: string
  metrics: CashBankMetric[]
  accounts: CashBankAccount[]
  movements: CashBankMovement[]
  cashFlow: CashFlowPoint[]
}

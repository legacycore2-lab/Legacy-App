// ─── Domain enums ─────────────────────────────────────────────────────────────
export type CashBankMetricTone = 'green' | 'blue' | 'gold' | 'purple'
export type CashBankAccountKind = 'cash' | 'bank'
export type CashBankTransactionType = 'deposit' | 'withdrawal' | 'transfer'
export type CashBankTransactionStatus = 'draft' | 'posted' | 'void'

// ─── Supabase DTOs (mirror DB columns) ────────────────────────────────────────
export interface CashBankAccountRow {
  id: string
  ledger_account_id: string
  name: string
  account_kind: CashBankAccountKind
  bank_name: string | null
  account_number: string | null
  iban: string | null
  branch_name: string | null
  opening_balance: number
  currency_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CashBankBalanceRow {
  id: string
  ledger_account_id: string
  name: string
  account_kind: CashBankAccountKind
  bank_name: string | null
  account_number: string | null
  iban: string | null
  branch_name: string | null
  currency_code: string
  is_active: boolean
  opening_balance: number
  current_balance: number
}

export interface CashBankTransactionRow {
  id: string
  transaction_number: number
  transaction_date: string
  transaction_type: CashBankTransactionType
  source_account_id: string | null
  destination_account_id: string | null
  amount: number
  description: string
  reference_number: string | null
  status: CashBankTransactionStatus
  journal_id: string | null
  posted_at: string | null
  voided_at: string | null
  created_at: string
  updated_at: string
  reversal_of_transaction_id: string | null
}

// ─── Domain models ─────────────────────────────────────────────────────────────
export interface CashBankAccount {
  id: string
  ledgerAccountId: string
  name: string
  kind: CashBankAccountKind
  bankName: string | null
  accountNumber: string | null
  iban: string | null
  branchName: string | null
  openingBalance: number
  currentBalance: number
  currencyCode: string
  isActive: boolean
}

export interface CashBankLedgerAccountOption {
  id: string
  code: string
  name: string
}

export interface CashBankDepositAccountOption {
  id: string
  ledgerAccountId: string
  name: string
}

export interface CashBankOffsetAccountOption {
  id: string
  code: string
  name: string
}

export interface CashBankDepositInput {
  destinationAccountId: string
  offsetAccountId: string
  transactionDate: string
  amount: string
  description: string
  referenceNumber: string
}

export interface CashBankDepositPayload {
  clientRequestId: string
  destinationAccountId: string
  offsetAccountId: string
  transactionDate: string
  amount: number
  description: string
  referenceNumber: string | null
}

export interface CashBankDepositFormState {
  isOpen: boolean
  value: CashBankDepositInput
  destinationAccounts: CashBankDepositAccountOption[]
  offsetAccounts: CashBankOffsetAccountOption[]
  update: <K extends keyof CashBankDepositInput>(key: K, value: CashBankDepositInput[K]) => void
  open: () => void
  close: () => void
  submit: () => Promise<void>
  errors: string[]
  submitted: boolean
  isSaving: boolean
  saveError: string
}

export interface CashBankWithdrawalAccountOption {
  id: string
  ledgerAccountId: string
  name: string
  currentBalance: number
}

export interface CashBankWithdrawalInput {
  sourceAccountId: string
  offsetAccountId: string
  transactionDate: string
  amount: string
  description: string
  referenceNumber: string
}

export interface CashBankWithdrawalPayload {
  clientRequestId: string
  sourceAccountId: string
  offsetAccountId: string
  transactionDate: string
  amount: number
  description: string
  referenceNumber: string | null
}

export interface CashBankWithdrawalFormState {
  isOpen: boolean
  value: CashBankWithdrawalInput
  sourceAccounts: CashBankWithdrawalAccountOption[]
  offsetAccounts: CashBankOffsetAccountOption[]
  update: <K extends keyof CashBankWithdrawalInput>(key: K, value: CashBankWithdrawalInput[K]) => void
  open: () => void
  close: () => void
  submit: () => Promise<void>
  errors: string[]
  submitted: boolean
  isSaving: boolean
  saveError: string
}

export interface CashBankTransferAccountOption {
  id: string
  ledgerAccountId: string
  name: string
  currentBalance: number
}

export interface CashBankTransferInput {
  sourceAccountId: string
  destinationAccountId: string
  transactionDate: string
  amount: string
  description: string
  referenceNumber: string
}

export interface CashBankTransferPayload {
  clientRequestId: string
  sourceAccountId: string
  destinationAccountId: string
  transactionDate: string
  amount: number
  description: string
  referenceNumber: string | null
}

export interface CashBankTransferFormState {
  isOpen: boolean
  value: CashBankTransferInput
  accounts: CashBankTransferAccountOption[]
  update: <K extends keyof CashBankTransferInput>(key: K, value: CashBankTransferInput[K]) => void
  open: () => void
  close: () => void
  submit: () => Promise<void>
  errors: string[]
  submitted: boolean
  isSaving: boolean
  saveError: string
}

export interface CashBankAccountInput {
  ledgerAccountId: string
  name: string
  kind: CashBankAccountKind
  bankName: string
  accountNumber: string
  iban: string
  branchName: string
  openingBalance: string
  currencyCode: string
  isActive: boolean
}

export interface CashBankAccountPayload {
  ledger_account_id: string
  name: string
  account_kind: CashBankAccountKind
  bank_name: string | null
  account_number: string | null
  iban: string | null
  branch_name: string | null
  opening_balance: number
  currency_code: 'EGP'
  is_active: boolean
}

export type CashBankAccountUpdatePayload = Omit<
  CashBankAccountPayload,
  'ledger_account_id' | 'opening_balance'
>

export interface CashBankAccountFormState {
  isOpen: boolean
  isEditing: boolean
  value: CashBankAccountInput
  ledgerAccounts: CashBankLedgerAccountOption[]
  update: <K extends keyof CashBankAccountInput>(key: K, value: CashBankAccountInput[K]) => void
  openCreate: () => void
  openEdit: (id: string) => Promise<void>
  close: () => void
  submit: () => Promise<void>
  deactivate: () => Promise<void>
  errors: string[]
  submitted: boolean
  isLoading: boolean
  isSaving: boolean
  saveError: string
}

// ─── View models (UI layer input) ─────────────────────────────────────────────
export interface CashBankMetric {
  id: string
  label: string
  value: string
  change: string
  tone: CashBankMetricTone
}

export interface CashBankAccountSummary {
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
  account: string
  type: CashBankTransactionType
  amount: string
  status: CashBankTransactionStatus
  canReverse: boolean
}

export interface CashBankReversalInput {
  transactionId: string
  reversalDate: string
  reason: string
}

export interface CashBankReversalPayload {
  clientRequestId: string
  transactionId: string
  reversalDate: string
  reason: string
}

export interface CashBankReversalFormState {
  isOpen: boolean
  movement: CashBankMovement | null
  reversalDate: string
  reason: string
  updateDate: (value: string) => void
  updateReason: (value: string) => void
  open: (movement: CashBankMovement) => void
  close: () => void
  submit: () => Promise<void>
  errors: string[]
  submitted: boolean
  isSaving: boolean
  saveError: string
}

export interface CashFlowPoint {
  month: string
  income: number
  expense: number
}

export interface CashBanksViewModel {
  asOfDate: string
  metrics: CashBankMetric[]
  accounts: CashBankAccountSummary[]
  movements: CashBankMovement[]
  cashFlow: CashFlowPoint[]
}

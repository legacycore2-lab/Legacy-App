import { DataValidationError } from '../../../shared/errors/app-error'
import {
  checkDuplicateAccountName,
  createCashBankAccount,
  deactivateCashBankAccount,
  findAvailableLedgerAccounts,
  findCashBankAccountById,
  findCashBankBalances,
  findRecentCashBankTransactions,
  updateCashBankAccount,
} from '../repositories/cash-banks.repository'
import type {
  CashBankAccount,
  CashBankAccountInput,
  CashBankAccountPayload,
  CashBankAccountRow,
  CashBankAccountUpdatePayload,
  CashBankAccountSummary,
  CashBankBalanceRow,
  CashBankMetric,
  CashBankMetricTone,
  CashBankMovement,
  CashBankTransactionRow,
  CashBanksViewModel,
  CashFlowPoint,
} from '../types/cash-banks.types'

function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateCashBankAccountInput(input: CashBankAccountInput): string[] {
  const errors: string[] = []
  const openingBalance = Number(input.openingBalance)

  if (!clean(input.name)) errors.push('اسم الحساب مطلوب.')
  if (!input.ledgerAccountId) errors.push('حساب الأستاذ مطلوب.')
  if (input.kind !== 'cash' && input.kind !== 'bank') errors.push('نوع الحساب غير صالح.')
  if (!Number.isFinite(openingBalance) || openingBalance < 0)
    errors.push('الرصيد الافتتاحي يجب ألا يقل عن صفر.')
  if (input.currencyCode !== 'EGP') errors.push('العملة المتاحة حاليًا هي الجنيه المصري فقط.')
  if (
    input.kind === 'cash' &&
    [input.bankName, input.accountNumber, input.iban, input.branchName].some((value) => clean(value))
  ) {
    errors.push('لا يمكن إضافة بيانات بنكية إلى حساب خزنة.')
  }

  return errors
}

function buildAccountPayload(input: CashBankAccountInput): CashBankAccountPayload {
  const errors = validateCashBankAccountInput(input)
  if (errors.length > 0) throw new DataValidationError(errors[0])

  const bankValue = (value: string) => (input.kind === 'bank' ? clean(value) || null : null)
  return {
    ledger_account_id: input.ledgerAccountId,
    name: clean(input.name),
    account_kind: input.kind,
    bank_name: bankValue(input.bankName),
    account_number: bankValue(input.accountNumber),
    iban: bankValue(input.iban),
    branch_name: bankValue(input.branchName),
    opening_balance: Number(input.openingBalance),
    currency_code: 'EGP',
    is_active: input.isActive,
  }
}

function buildAccountUpdatePayload(payload: CashBankAccountPayload): CashBankAccountUpdatePayload {
  return {
    name: payload.name,
    account_kind: payload.account_kind,
    bank_name: payload.bank_name,
    account_number: payload.account_number,
    iban: payload.iban,
    branch_name: payload.branch_name,
    currency_code: payload.currency_code,
    is_active: payload.is_active,
  }
}

function mapAccount(row: CashBankAccountRow): CashBankAccount {
  return {
    id: row.id,
    ledgerAccountId: row.ledger_account_id,
    name: row.name,
    kind: row.account_kind,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    iban: row.iban,
    branchName: row.branch_name,
    openingBalance: Number(row.opening_balance),
    currentBalance: Number(row.opening_balance),
    currencyCode: row.currency_code,
    isActive: row.is_active,
  }
}

export async function getCashBankAccount(id: string): Promise<CashBankAccount> {
  const row = await findCashBankAccountById(id)
  if (!row) throw new DataValidationError('الحساب المطلوب غير موجود.')
  return mapAccount(row)
}

export async function getCashBankLedgerAccounts() {
  return findAvailableLedgerAccounts()
}

export async function saveCashBankAccount(input: CashBankAccountInput, id?: string): Promise<void> {
  const payload = buildAccountPayload(input)
  if (await checkDuplicateAccountName(payload.name, id)) {
    throw new DataValidationError('يوجد حساب خزنة أو بنك بنفس الاسم.')
  }

  if (id) await updateCashBankAccount(id, buildAccountUpdatePayload(payload))
  else await createCashBankAccount(payload)
}

export async function disableCashBankAccount(id: string): Promise<void> {
  if (!id) throw new DataValidationError('معرّف الحساب مطلوب.')
  await deactivateCashBankAccount(id)
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const money = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function formatMoney(value: number): string {
  return money.format(value).replace('EGP', 'ج.م').trim()
}

function formatDate(iso: string): string {
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : dateFormatter.format(parsed)
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
function toneForAccount(kind: string, index: number): CashBankMetricTone {
  if (kind === 'cash') return index % 2 === 0 ? 'green' : 'gold'
  return index % 2 === 0 ? 'blue' : 'purple'
}

function buildMetrics(balances: CashBankBalanceRow[]): CashBankMetric[] {
  const totalLiquidity = balances.reduce((sum, b) => sum + b.current_balance, 0)
  const totalBank = balances
    .filter((b) => b.account_kind === 'bank')
    .reduce((sum, b) => sum + b.current_balance, 0)
  const totalCash = balances
    .filter((b) => b.account_kind === 'cash')
    .reduce((sum, b) => sum + b.current_balance, 0)

  return [
    {
      id: 'liquidity',
      label: 'إجمالي السيولة',
      value: formatMoney(totalLiquidity),
      change: '',
      tone: 'green',
    },
    {
      id: 'banks',
      label: 'إجمالي البنوك',
      value: formatMoney(totalBank),
      change: '',
      tone: 'blue',
    },
    {
      id: 'cash',
      label: 'إجمالي الخزنة',
      value: formatMoney(totalCash),
      change: '',
      tone: 'gold',
    },
    {
      id: 'accounts',
      label: 'عدد الحسابات',
      value: String(balances.length),
      change: '',
      tone: 'purple',
    },
  ]
}

function buildAccountSummaries(balances: CashBankBalanceRow[]): CashBankAccountSummary[] {
  const maxBalance = Math.max(...balances.map((b) => b.current_balance), 1)
  return balances.map((b, index) => ({
    id: b.id,
    name: b.name,
    kind: b.account_kind,
    balance: formatMoney(b.current_balance),
    progress: Math.round((b.current_balance / maxBalance) * 100),
    tone: toneForAccount(b.account_kind, index),
  }))
}

function buildMovements(
  transactions: CashBankTransactionRow[],
  balances: CashBankBalanceRow[],
): CashBankMovement[] {
  const accountNameById = new Map(balances.map((b) => [b.id, b.name]))

  return transactions.map((t) => {
    const accountId = t.destination_account_id ?? t.source_account_id
    const accountName = accountId ? (accountNameById.get(accountId) ?? '—') : '—'
    const sign = t.source_account_id && !t.destination_account_id ? '-' : '+'

    return {
      id: t.id,
      number: t.transaction_number.toLocaleString('ar-EG'),
      date: formatDate(t.transaction_date),
      account: accountName,
      type: t.transaction_type,
      amount: `${sign}${formatMoney(t.amount)}`,
      status: t.status,
    }
  })
}

function buildCashFlow(transactions: CashBankTransactionRow[]): CashFlowPoint[] {
  const monthlyMap = new Map<string, { income: number; expense: number }>()
  const monthFormatter = new Intl.DateTimeFormat('ar-EG', { month: 'long' })

  for (const t of transactions) {
    if (t.status !== 'posted') continue
    const d = new Date(t.transaction_date)
    if (Number.isNaN(d.getTime())) continue
    const key = monthFormatter.format(d)
    const entry = monthlyMap.get(key) ?? { income: 0, expense: 0 }
    if (t.transaction_type === 'deposit') entry.income += t.amount
    else if (t.transaction_type === 'withdrawal') entry.expense += t.amount
    monthlyMap.set(key, entry)
  }

  return Array.from(monthlyMap.entries()).map(([month, v]) => ({
    month,
    income: Math.round(v.income / 1000),
    expense: Math.round(v.expense / 1000),
  }))
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export async function getCashBanksViewModel(): Promise<CashBanksViewModel> {
  const [balances, transactions] = await Promise.all([
    findCashBankBalances(),
    findRecentCashBankTransactions(20),
  ])

  return {
    asOfDate: dateFormatter.format(new Date()),
    metrics: buildMetrics(balances),
    accounts: buildAccountSummaries(balances),
    movements: buildMovements(transactions, balances),
    cashFlow: buildCashFlow(transactions),
  }
}

export type FinancialEntryType = 'income' | 'expense'

export interface FinancialAmountEntry {
  type: FinancialEntryType
  amount: number
  isReversal?: boolean
}

export interface FinancialTotals {
  income: number
  expense: number
  net: number
}

export function financialAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new TypeError('Financial amount must be a finite number')
  }

  return amount
}

export function reverseFinancialAmount(amount: number): number {
  return -financialAmount(amount)
}

export function effectiveFinancialAmount(amount: number, isReversal = false): number {
  const value = financialAmount(amount)
  return isReversal ? -value : value
}

export function aggregateFinancialTotals(entries: readonly FinancialAmountEntry[]): FinancialTotals {
  let income = 0
  let expense = 0

  for (const entry of entries) {
    const amount = effectiveFinancialAmount(entry.amount, entry.isReversal)

    if (entry.type === 'income') {
      income += amount
    } else {
      expense += amount
    }
  }

  return {
    income,
    expense,
    net: income - expense,
  }
}

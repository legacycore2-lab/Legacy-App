export type FinancialEntryType = 'income' | 'expense'

export interface FinancialAmountEntry {
  type: FinancialEntryType
  amount: number
}

export interface FinancialTotals {
  income: number
  expense: number
  net: number
}

/**
 * Amounts are intentionally signed.
 * Reversal rows must keep their negative sign so an original/reversal pair nets to zero.
 */
export function financialAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new TypeError('Financial amount must be a finite number')
  }

  return amount
}

export function reverseFinancialAmount(amount: number): number {
  return -financialAmount(amount)
}

export function aggregateFinancialTotals(entries: readonly FinancialAmountEntry[]): FinancialTotals {
  let income = 0
  let expense = 0

  for (const entry of entries) {
    const amount = financialAmount(entry.amount)

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

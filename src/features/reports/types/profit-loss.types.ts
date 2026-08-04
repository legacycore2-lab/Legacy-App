export type ProfitLossFilters = {
  dateFrom: string
  dateTo: string
  projectId: string
}

export type ProfitLossProjectRow = {
  projectId: string
  projectName: string
  contractValue: number
  income: number
  expense: number
  net: number
  marginPercent: number | null
  entryCount: number
}

export type ProfitLossMonthlyRow = {
  monthKey: string
  monthLabel: string
  income: number
  expense: number
  net: number
}

export type ProfitLossSummary = {
  totalIncome: number
  totalExpense: number
  netProfit: number
  profitMarginPercent: number | null
  projectCount: number
  entryCount: number
}

export type ProfitLossViewModel = {
  summary: ProfitLossSummary
  projectRows: ProfitLossProjectRow[]
  monthlyRows: ProfitLossMonthlyRow[]
  projectOptions: { id: string; name: string }[]
  topProfitProject: ProfitLossProjectRow | null
  topLossProject: ProfitLossProjectRow | null
}

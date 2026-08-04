// ─── Executive Analytics ───────────────────────────────────────────────────

export type ExecutiveKPIs = {
  totalProjects: number
  activeProjects: number
  totalContractValue: number
  totalIncome: number
  totalExpense: number
  netProfit: number
  profitMargin: number
  collectionRate: number
}

export type ProjectHealthItem = {
  id: string
  name: string
  code: string
  status: string
  progress: number
  contractValue: number
  income: number
  expense: number
  net: number
  profitMargin: number
  isArchived: boolean
}

// ─── Journal Analytics ─────────────────────────────────────────────────────

export type JournalAnalyticsEntryRecord = {
  id: string
  entry_number: number | null
  entry_date: string
  entry_type: string | null
  category: string | null
  description: string | null
  contractor_name: string | null
  payment_method: string | null
  amount: number | string
  project_id: string | null
  project_name?: string | null
}

export type JournalAnalyticsFilters = {
  dateFrom: string
  dateTo: string
  projectId: string
  entryType: 'all' | 'income' | 'expense'
  contractor: string
  paymentMethod: string
  query: string
}

export type JournalAnalyticsRow = {
  id: string
  entryNumber: number
  date: string
  type: 'income' | 'expense' | 'unknown'
  category: string
  description: string
  contractor: string
  paymentMethod: string
  amount: number
  projectName: string
  projectId: string
}

export type JournalAnalyticsTotals = {
  totalIncome: number
  totalExpense: number
  netProfit: number
  count: number
}

export type JournalAnalyticsViewModel = {
  rows: JournalAnalyticsRow[]
  totals: JournalAnalyticsTotals
  contractors: string[]
  paymentMethods: string[]
}

// ─── Smart Insights ────────────────────────────────────────────────────────

export type InsightSeverity = 'info' | 'warning' | 'danger' | 'success'

export type SmartInsight = {
  id: string
  severity: InsightSeverity
  title: string
  description: string
  value?: string
}

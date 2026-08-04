// ─── Raw DB Records ────────────────────────────────────────────────────────────

export type ReportProjectRecord = {
  id: string
  name: string
  code: string | null
  client_name: string | null
  status: string | null
  progress: number | string | null
  contract_value: number | string | null
  is_archived: boolean | null
}

export type ReportEntryRecord = {
  project_id: string
  entry_type: string | null
  amount: number | string | null
  entry_number: number | null
}

export type ReportJournalEntryRecord = {
  id: string
  entry_date: string
  entry_type: string | null
  amount: number | string | null
  contractor: string | null
  payment_method: string | null
  project_id: string | null
  project_name: string | null
  description: string | null
}

// ─── Domain Rows ───────────────────────────────────────────────────────────────

export type ReportProjectRow = {
  id: string
  name: string
  code: string
  client: string
  status: string
  progress: number
  contractValue: number
  income: number
  expense: number
  net: number
  remaining: number
  entryCount: number
  isArchived: boolean
}

export type ReportJournalRow = {
  id: string
  date: string
  type: 'income' | 'expense' | 'unknown'
  amount: number
  contractor: string
  paymentMethod: string
  projectId: string
  projectName: string
  description: string
}

// ─── Summary / KPI ────────────────────────────────────────────────────────────

export type ReportsSummary = {
  projectCount: number
  contractValue: number
  income: number
  expense: number
  net: number
  remaining: number
}

export type JournalSummary = {
  totalIncome: number
  totalExpense: number
  netProfit: number
  entryCount: number
}

// ─── Smart Insight ────────────────────────────────────────────────────────────

export type InsightSeverity = 'info' | 'warning' | 'danger' | 'success'

export type SmartInsight = {
  id: string
  severity: InsightSeverity
  title: string
  detail: string
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export type JournalReportFilters = {
  query: string
  dateFrom: string
  dateTo: string
  projectId: string
  entryType: 'all' | 'income' | 'expense'
  contractor: string
  paymentMethod: string
}

// ─── View Models ──────────────────────────────────────────────────────────────

export type ReportsViewModel = {
  rows: ReportProjectRow[]
  summary: ReportsSummary
}

export type JournalReportViewModel = {
  rows: ReportJournalRow[]
  summary: JournalSummary
  contractors: string[]
  paymentMethods: string[]
}

export type AnalyticsViewModel = {
  executive: ReportsViewModel
  insights: SmartInsight[]
}

// ─── Raw DB Records (match Supabase columns exactly) ──────────────────────────

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
  entry_number: number | null
  contractor_name: string | null
  payment_method: string | null
  project_id: string | null
  description: string | null
  project: { name: string } | { name: string }[] | null
}

// ─── Domain rows (output of service mapping) ─────────────────────────────────

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
  dateFormatted: string
  entryType: 'income' | 'expense' | 'unknown'
  amount: number
  contractorName: string
  paymentMethod: string
  projectId: string
  projectName: string
  description: string
}

// ─── Summaries ────────────────────────────────────────────────────────────────

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

// ─── Top projects ─────────────────────────────────────────────────────────────

export type TopProjectsResult = {
  profitable: ReportProjectRow[]
  lossMaking: ReportProjectRow[]
}

// ─── Smart Insights ───────────────────────────────────────────────────────────

export type InsightSeverity = 'success' | 'info' | 'warning' | 'danger'

export type SmartInsight = {
  id: string
  severity: InsightSeverity
  title: string
  detail: string
}

// ─── Journal filters ──────────────────────────────────────────────────────────

export type JournalReportFilters = {
  query: string
  dateFrom: string
  dateTo: string
  projectId: string
  entryType: 'all' | 'income' | 'expense'
  contractorName: string
  paymentMethod: string
}

// ─── View models ──────────────────────────────────────────────────────────────

export type ExecutiveViewModel = {
  summary: ReportsSummary
  topProjects: TopProjectsResult
  rows: ReportProjectRow[]
}

export type ProjectsReportViewModel = {
  allRows: ReportProjectRow[]
}

export type JournalReportViewModel = {
  allRows: ReportJournalRow[]
  contractors: string[]
  paymentMethods: string[]
  projectOptions: { id: string; name: string }[]
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

export type ReportsTab = 'executive' | 'projects' | 'journal' | 'insights'

export type TabularRow = Record<string, string | number | boolean | null>

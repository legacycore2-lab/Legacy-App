export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived'

export type Project = {
  id: string
  code: string
  name: string
  client: string
  location: string
  manager: string
  status: ProjectStatus
  progress: number
  contractValue: number
  received: number
  spent: number
  startDate: string
  endDate: string
  notes: string
}

export type ProjectStatusFilter = 'all' | ProjectStatus

export type ProjectRow = Project & {
  balance: number
}

export type ProjectsSummary = {
  total: number
  active: number
  completed: number
  paused: number
  totalContracts: number
  totalLiquidity: number
}

/**
 * Database representation returned by Supabase.
 * This type stays at the repository/mapper boundary and must not reach the UI.
 * Optional compatibility fields support the current legacy schema while the
 * mapper exposes one stable domain model to the rest of the feature.
 */
export type ProjectRecord = {
  id: string
  name: string
  code?: string | null
  client_name?: string | null
  location?: string | null
  manager?: string | null
  status?: string | null
  progress?: number | string | null
  contract_value?: number | string | null
  received?: number | string | null
  spent?: number | string | null
  start_date?: string | null
  end_date?: string | null
  close_date?: string | null
  notes?: string | null
  is_archived?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
}

export type ProjectInsertRecord = {
  name: string
  code: string | null
  client_name: string | null
  location: string | null
  manager: string | null
  status: Exclude<ProjectStatus, 'archived'>
  contract_value: number
  start_date: string
  end_date: string | null
  notes: string | null
  is_archived: false
}

export type ProjectEntry = {
  id: string
  seq: number | null
  entryDate: string
  /** 'unknown' when the raw DB entry_type could not be normalised */
  type: 'income' | 'expense' | 'unknown'
  category: string
  description: string
  contractor: string
  paymentMethod: string
  amount: number
}

export type ProjectFinancialSummary = {
  totalIncome: number
  totalExpense: number
  balance: number
  entryCount: number
}

export type ProjectExpenseCategory = {
  label: string
  value: number
  percentage: number
}

export type ProjectAnalytics = {
  recentEntries: ProjectEntry[]
  expenseCategories: ProjectExpenseCategory[]
}

export type ProjectDetails = {
  project: Project
  entries: ProjectEntry[]
  summary: ProjectFinancialSummary
  analytics: ProjectAnalytics
}

export type DonutSegment = {
  label: string
  percentage: number
  cssVar: string
}

export type ProjectDetailsViewModel = {
  project: Project
  summary: ProjectFinancialSummary
  analytics: ProjectAnalytics
  /** 0–100, clamped and normalised */
  progress: number
  /** contractValue − totalExpense */
  remaining: number
  /** balance / totalIncome × 100, 0 when no income */
  profitMargin: number
  /** top-5 expense categories ready for the donut chart */
  donutSegments: DonutSegment[]
  /** conic-gradient() string ready for inline style */
  donutGradient: string
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

export type MonthlyCashflowBar = {
  /** Arabic short month label e.g. "يناير" */
  label: string
  /** 0–100 normalised height for income bar */
  incomeHeight: number
  /** 0–100 normalised height for expense bar */
  expenseHeight: number
  /** raw income total for tooltip / aria */
  incomeAmount: number
  /** raw expense total for tooltip / aria */
  expenseAmount: number
}

export type ProjectFinanceViewModel = {
  summary: ProjectFinancialSummary
  /** last 7 calendar months oldest → newest, ready for left→right display */
  monthlyCashflow: MonthlyCashflowBar[]
  donutSegments: DonutSegment[]
  donutGradient: string
  profitMargin: number
  remaining: number
  contractValue: number
  /** true when at least one bar has income or expense > 0 */
  hasActivity: boolean
  /** 0–100 share of total (income + expense) for income bar */
  incomeSharePercentage: number
  /** 0–100 share of total (income + expense) for expense bar */
  expenseSharePercentage: number
}

// ─── Journal Tab ──────────────────────────────────────────────────────────────

export type ProjectJournalViewModel = {
  /** Entries sorted newest-first by date, then sequence number. */
  entries: ProjectEntry[]
  summary: ProjectFinancialSummary
  hasEntries: boolean
}

import type { LucideIcon } from 'lucide-react'

export type DashboardKpi = {
  label: string
  value: string
  trend: string
  icon: LucideIcon
  tone: 'green' | 'gold'
  unit?: string
}

export type DashboardHeaderSummary = {
  activeProjects: string
  alerts: string
  balance: string
  lastUpdated: string
}

export type DashboardProject = {
  id: string
  name: string
  client: string
  balance: string
  progress: number
  status: 'active' | 'paused' | 'completed' | 'archived'
}

export type DashboardEntry = {
  id: string
  project: string
  description: string
  date: string
  amount: string
  /** 'unknown' when DB entry_type could not be normalised — shown neutrally, excluded from totals */
  type: 'income' | 'expense' | 'unknown'
}

export type DashboardAction = { label: string; description: string; icon: LucideIcon }

export type DashboardData = {
  header: DashboardHeaderSummary
  kpis: DashboardKpi[]
  projects: DashboardProject[]
  entries: DashboardEntry[]
  actions: DashboardAction[]
}

export type DashboardProjectRecord = {
  id: string
  name: string
  client_name: string | null
  status: string | null
  progress: number | string | null
  is_archived: boolean | null
  created_at: string | null
}

export type DashboardFinancialEntryRecord = {
  project_id: string | null
  type: string | null
  amount: number | string | null
  is_reversal: boolean | null
  seq: number | null
}

export type DashboardRecentEntryRecord = DashboardFinancialEntryRecord & {
  id: string
  description: string | null
  entry_date: string | null
}

export type DashboardSourceData = {
  projects: DashboardProjectRecord[]
  financialEntries: DashboardFinancialEntryRecord[]
  recentEntries: DashboardRecentEntryRecord[]
}

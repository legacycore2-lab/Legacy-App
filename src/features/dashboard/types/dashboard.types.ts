import type { LucideIcon } from 'lucide-react'

export type DashboardKpi = {
  label: string
  value: string
  trend: string
  icon: LucideIcon
  tone: 'green' | 'gold'
}

export type DashboardProject = {
  name: string
  client: string
  balance: string
  progress: number
  status: string
}

export type DashboardEntry = {
  id: string
  project: string
  description: string
  date: string
  amount: string
  type: 'income' | 'expense'
}

export type DashboardAction = { label: string; description: string; icon: LucideIcon }

export type DashboardHeaderSummary = {
  activeProjects: number
  balance: string
  lastUpdated: string
}

export type DashboardData = {
  kpis: DashboardKpi[]
  projects: DashboardProject[]
  entries: DashboardEntry[]
  actions: DashboardAction[]
  header: DashboardHeaderSummary
}

// ── DB layer ──────────────────────────────────────────────────────
export type DashboardProjectRecord = {
  id: string
  name: string
  client_name: string | null
  status: string
  progress: number
  received: number | string
  spent: number | string
}

export type DashboardEntryRecord = {
  id: string
  entry_number: number | null
  entry_date: string
  entry_type: string
  description: string | null
  amount: number | string
  project: { name: string } | { name: string }[] | null
}

export type DashboardSummaryRecord = {
  total_income: number | string
  total_expense: number | string
  project_count: number
  active_project_count: number
}

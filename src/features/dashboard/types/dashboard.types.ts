import type { LucideIcon } from 'lucide-react'

export type DashboardKpi = {
  label: string
  value: string
  trend: string
  icon: LucideIcon
  tone: 'green' | 'gold'
}

export type DashboardHeaderSummary = {
  activeProjects: string
  alerts: string
  balance: string
  lastUpdated: string
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
}

export type DashboardEntryRecord = {
  id: string
  project_id: string | null
  type: string | null
  amount: number | string | null
  description: string | null
  entry_date: string | null
  seq: number | null
  is_reversal: boolean | null
}

export type DashboardSourceData = {
  projects: DashboardProjectRecord[]
  entries: DashboardEntryRecord[]
}

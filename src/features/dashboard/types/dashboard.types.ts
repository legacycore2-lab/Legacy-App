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

export type DashboardAction = {
  label: string
  description: string
  path: string
  icon: LucideIcon
}

export type DashboardAlert = {
  id: string
  title: string
  description: string
  tone: 'danger' | 'warning' | 'success'
}

export type DashboardData = {
  kpis: DashboardKpi[]
  projects: DashboardProject[]
  entries: DashboardEntry[]
  actions: DashboardAction[]
  alerts: DashboardAlert[]
}

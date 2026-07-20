import { dashboardActions, dashboardEntries, dashboardKpis } from '../data/dashboard.mock'
import type { DashboardAction, DashboardEntry, DashboardKpi } from '../types/dashboard.types'

export type DashboardStaticData = {
  kpis: DashboardKpi[]
  entries: DashboardEntry[]
  actions: DashboardAction[]
}

export async function findDashboardData(): Promise<DashboardStaticData> {
  return {
    kpis: dashboardKpis,
    entries: dashboardEntries,
    actions: dashboardActions,
  }
}

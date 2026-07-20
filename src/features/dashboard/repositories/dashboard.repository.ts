import { dashboardActions, dashboardEntries, dashboardKpis, dashboardProjects } from '../data/dashboard.mock'
import type { DashboardData } from '../types/dashboard.types'

type DashboardSourceData = Omit<DashboardData, 'alerts'>

export async function findDashboardData(): Promise<DashboardSourceData> {
  return {
    kpis: dashboardKpis,
    projects: dashboardProjects,
    entries: dashboardEntries,
    actions: dashboardActions,
  }
}

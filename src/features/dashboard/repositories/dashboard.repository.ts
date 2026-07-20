import { dashboardActions, dashboardEntries, dashboardKpis, dashboardProjects } from '../data/dashboard.mock'
import type { DashboardData } from '../types/dashboard.types'

export async function findDashboardData(): Promise<DashboardData> {
  return {
    kpis: dashboardKpis,
    projects: dashboardProjects,
    entries: dashboardEntries,
    actions: dashboardActions,
  }
}

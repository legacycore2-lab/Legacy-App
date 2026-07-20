import { dashboardActions, dashboardEntries } from '../data/dashboard.mock'
import type { DashboardAction, DashboardEntry } from '../types/dashboard.types'

export type DashboardStaticData = {
  entries: DashboardEntry[]
  actions: DashboardAction[]
}

export async function findDashboardData(): Promise<DashboardStaticData> {
  return {
    entries: dashboardEntries,
    actions: dashboardActions,
  }
}

import { dashboardActions } from '../data/dashboard.mock'
import type { DashboardAction } from '../types/dashboard.types'

export type DashboardStaticData = {
  actions: DashboardAction[]
}

export async function findDashboardData(): Promise<DashboardStaticData> {
  return {
    actions: dashboardActions,
  }
}

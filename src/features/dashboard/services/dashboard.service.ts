import { findDashboardData } from '../repositories/dashboard.repository'
import type { DashboardData } from '../types/dashboard.types'
import { buildDashboardAlerts } from './dashboard-alerts.service'

export async function getDashboardData(): Promise<DashboardData> {
  const data = await findDashboardData()

  return {
    ...data,
    alerts: buildDashboardAlerts(data.projects, data.entries),
  }
}

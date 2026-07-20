import { dashboardActions, dashboardEntries, dashboardKpis } from '../data/dashboard.mock'
import { mapDashboardProject } from '../mappers/dashboard-project.mapper'
import type { DashboardData } from '../types/dashboard.types'
import { findDashboardProjects } from './dashboard-projects.repository'

type DashboardSourceData = Omit<DashboardData, 'alerts'>

export async function findDashboardData(): Promise<DashboardSourceData> {
  const projectRecords = await findDashboardProjects()

  return {
    kpis: dashboardKpis,
    projects: projectRecords.map(mapDashboardProject),
    entries: dashboardEntries,
    actions: dashboardActions,
  }
}

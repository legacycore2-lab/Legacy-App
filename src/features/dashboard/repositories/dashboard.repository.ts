import { dashboardActions, dashboardEntries, dashboardKpis } from '../data/dashboard.mock'
import { mapDashboardProject } from '../mappers/dashboard-project.mapper'
import { buildDashboardProjectBalances } from '../services/dashboard-project-balances.service'
import type { DashboardData } from '../types/dashboard.types'
import { findDashboardProjectEntries } from './dashboard-project-balances.repository'
import { findDashboardProjects } from './dashboard-projects.repository'

type DashboardSourceData = Omit<DashboardData, 'alerts'>

export async function findDashboardData(): Promise<DashboardSourceData> {
  const projectRecords = await findDashboardProjects()
  const projectEntries = await findDashboardProjectEntries(projectRecords.map((project) => project.id))
  const balances = buildDashboardProjectBalances(projectEntries)

  return {
    kpis: dashboardKpis,
    projects: projectRecords.map((project) =>
      mapDashboardProject(project, balances.get(project.id) ?? 0),
    ),
    entries: dashboardEntries,
    actions: dashboardActions,
  }
}

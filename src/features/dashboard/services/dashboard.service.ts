import { mapDashboardEntry } from '../mappers/dashboard-entry.mapper'
import { mapDashboardProject } from '../mappers/dashboard-project.mapper'
import { findDashboardKpiSource } from '../repositories/dashboard-kpis.repository'
import { findDashboardProjectEntries } from '../repositories/dashboard-project-balances.repository'
import { findDashboardProjects } from '../repositories/dashboard-projects.repository'
import { findDashboardRecentEntries } from '../repositories/dashboard-recent-entries.repository'
import { findDashboardData } from '../repositories/dashboard.repository'
import type { DashboardData } from '../types/dashboard.types'
import { buildDashboardAlerts } from './dashboard-alerts.service'
import { buildDashboardKpis } from './dashboard-kpis.service'
import { buildDashboardProjectBalances } from './dashboard-project-balances.service'

export async function getDashboardData(): Promise<DashboardData> {
  const [data, projectRecords, kpiSource, recentEntryRecords] = await Promise.all([
    findDashboardData(),
    findDashboardProjects(),
    findDashboardKpiSource(),
    findDashboardRecentEntries(),
  ])
  const projectEntries = await findDashboardProjectEntries(projectRecords.map((project) => project.id))
  const balances = buildDashboardProjectBalances(projectEntries)
  const projects = projectRecords.map((project) =>
    mapDashboardProject(project, balances.get(project.id) ?? 0),
  )
  const entries = recentEntryRecords.map(mapDashboardEntry)

  return {
    ...data,
    kpis: buildDashboardKpis(kpiSource),
    projects,
    entries,
    alerts: buildDashboardAlerts(projects, entries),
  }
}

import { mapDashboardEntry } from '../mappers/dashboard-entry.mapper'
import { mapDashboardProject } from '../mappers/dashboard-project.mapper'
import { findDashboardKpiSource, type DashboardKpiSource } from '../repositories/dashboard-kpis.repository'
import { findDashboardProjectEntries } from '../repositories/dashboard-project-balances.repository'
import {
  findDashboardProjects,
  type DashboardProjectRecord,
} from '../repositories/dashboard-projects.repository'
import {
  findDashboardRecentEntries,
  type DashboardRecentEntryRecord,
} from '../repositories/dashboard-recent-entries.repository'
import { findDashboardData } from '../repositories/dashboard.repository'
import type { DashboardData } from '../types/dashboard.types'
import { buildDashboardAlerts } from './dashboard-alerts.service'
import { buildDashboardKpis } from './dashboard-kpis.service'
import { buildDashboardProjectBalances } from './dashboard-project-balances.service'

const emptyKpiSource: DashboardKpiSource = {
  entries: [],
  activeProjectsCount: 0,
}

function valueOrFallback<Value>(result: PromiseSettledResult<Value>, fallback: Value): Value {
  return result.status === 'fulfilled' ? result.value : fallback
}

export async function getDashboardData(): Promise<DashboardData> {
  const data = await findDashboardData()
  const [projectsResult, kpisResult, recentEntriesResult] = await Promise.allSettled([
    findDashboardProjects(),
    findDashboardKpiSource(),
    findDashboardRecentEntries(),
  ])

  const projectRecords = valueOrFallback<DashboardProjectRecord[]>(projectsResult, [])
  const kpiSource = valueOrFallback<DashboardKpiSource>(kpisResult, emptyKpiSource)
  const recentEntryRecords = valueOrFallback<DashboardRecentEntryRecord[]>(recentEntriesResult, [])

  const projectEntries = projectRecords.length
    ? await findDashboardProjectEntries(projectRecords.map((project) => project.id)).catch(() => [])
    : []
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

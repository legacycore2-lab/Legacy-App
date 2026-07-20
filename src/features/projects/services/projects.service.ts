import { findProjects } from '../repositories/projects.repository'
import { mapProject } from './project.mapper'
import type { Project, ProjectRow, ProjectsSummary, ProjectsQuery } from '../types/project.types'

export async function getProjects(params: ProjectsQuery): Promise<Project[]> {
  const records = await findProjects(params)
  return records.map(mapProject)
}

export function summarizeProjects(projects: Project[]): ProjectsSummary {
  return projects.reduce<ProjectsSummary>(
    (summary, project) => ({
      total:          summary.total + 1,
      active:         summary.active    + (project.status === 'active'    ? 1 : 0),
      completed:      summary.completed + (project.status === 'completed' ? 1 : 0),
      paused:         summary.paused    + (project.status === 'paused'    ? 1 : 0),
      totalContracts: summary.totalContracts + project.contractValue,
      totalLiquidity: summary.totalLiquidity + project.received - project.spent,
    }),
    { total: 0, active: 0, completed: 0, paused: 0, totalContracts: 0, totalLiquidity: 0 },
  )
}

export function buildProjectRows(projects: Project[]): ProjectRow[] {
  return projects.map((project) => ({
    ...project,
    balance: project.received - project.spent,
  }))
}

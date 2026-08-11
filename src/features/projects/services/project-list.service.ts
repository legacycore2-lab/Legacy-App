import {
  findProjectFinancialEntries,
  findProjectsPage,
} from '../repositories/projects.repository'
import type { Project, ProjectsPage, ProjectsPageRequest } from '../types/project.types'
import { mapProject } from './project.mapper'
import {
  buildProjectFinancialTotals,
  buildProjectRows,
  mergeProjectsWithFinancialTotals,
} from './projects.service'

export const PROJECTS_PAGE_SIZE = 25

export async function getProjectsPage(request: ProjectsPageRequest): Promise<ProjectsPage> {
  const pageSize = Math.max(1, Math.min(100, Math.trunc(request.pageSize)))
  const requestedPage = Math.max(1, Math.trunc(request.page))
  const offset = (requestedPage - 1) * pageSize

  const result = await findProjectsPage({
    offset,
    limit: pageSize,
    query: request.query,
    status: request.status,
  })

  const totalPages = Math.max(1, Math.ceil(result.totalCount / pageSize))
  const page = Math.min(requestedPage, totalPages)

  if (page !== requestedPage && result.totalCount > 0) {
    return getProjectsPage({ ...request, page, pageSize })
  }

  const projects = result.records.reduce<Project[]>((items, record) => {
    try {
      items.push(mapProject(record))
    } catch (error) {
      console.warn('Skipping invalid project record on project list.', { recordId: record.id, error })
    }
    return items
  }, [])

  const financialEntries = await findProjectFinancialEntries(projects.map((project) => project.id))
  const totals = buildProjectFinancialTotals(financialEntries)
  const mergedProjects = mergeProjectsWithFinancialTotals(projects, totals)

  return {
    rows: buildProjectRows(mergedProjects),
    totalCount: result.totalCount,
    totalPages,
    page,
  }
}

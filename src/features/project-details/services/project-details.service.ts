import {
  findProjectDetails,
  findProjectEntries,
} from '../repositories/project-details.repository'
import type {
  ProjectEntriesPage,
  ProjectEntry,
  ProjectEntryFilters,
  ProjectEntrySummary,
} from '../types/project-details.types'
import { mapProjectDetails, mapProjectEntry } from './project-details.mapper'

export async function getProjectDetails(projectId: string) {
  const record = await findProjectDetails(projectId)
  return record ? mapProjectDetails(record) : null
}

function summarize(entries: ProjectEntry[], totalCount: number): ProjectEntrySummary {
  const pageIncome = entries.reduce(
    (total, entry) => total + (entry.type === 'income' ? entry.amount : 0),
    0,
  )
  const pageExpense = entries.reduce(
    (total, entry) => total + (entry.type === 'expense' ? entry.amount : 0),
    0,
  )

  return {
    totalCount,
    pageIncome,
    pageExpense,
    pageNet: pageIncome - pageExpense,
  }
}

export async function getProjectEntriesPage(input: {
  projectId: string
  page: number
  pageSize: number
  filters: ProjectEntryFilters
}): Promise<ProjectEntriesPage> {
  const pageSize = Math.min(Math.max(Math.trunc(input.pageSize), 1), 100)
  const page = Math.max(Math.trunc(input.page), 1)
  const result = await findProjectEntries({
    projectId: input.projectId,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    query: input.filters.query,
    type: input.filters.type,
  })
  const entries = result.records.map(mapProjectEntry)

  return {
    entries,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.totalCount / pageSize)),
    summary: summarize(entries, result.totalCount),
  }
}

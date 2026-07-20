import { findJournalEntries, findJournalProject } from '../repositories/journal.repository'
import type {
  JournalEntry,
  JournalPageRequest,
  JournalPageResult,
  JournalProjectHeader,
  JournalSummary,
} from '../types/journal.types'
import { mapJournalEntry } from './journal.mapper'

export function summarizeJournalPage(entries: JournalEntry[], totalCount: number): JournalSummary {
  const pageIncome = entries.reduce((total, entry) => total + (entry.type === 'income' ? entry.amount : 0), 0)
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

export async function getJournalProject(projectId: string): Promise<JournalProjectHeader | null> {
  const record = await findJournalProject(projectId)
  if (!record) return null

  return {
    id: record.id,
    name: record.name,
    startDate: record.start_date ?? '—',
    endDate: record.close_date ?? '—',
    status: record.is_archived ? 'archived' : record.close_date ? 'completed' : 'active',
  }
}

export async function getJournalPage(request: JournalPageRequest): Promise<JournalPageResult> {
  const pageSize = Math.min(Math.max(Math.trunc(request.pageSize), 1), 100)
  const page = Math.max(Math.trunc(request.page), 1)
  const result = await findJournalEntries({
    offset: (page - 1) * pageSize,
    limit: pageSize,
    query: request.filters.query,
    type: request.filters.type,
    projectId: request.projectId,
  })
  const entries = result.records.map(mapJournalEntry)

  return {
    entries,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.totalCount / pageSize)),
    summary: summarizeJournalPage(entries, result.totalCount),
  }
}

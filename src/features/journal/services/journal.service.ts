import {
  findJournalDetails,
  findJournalEntries,
  subscribeToJournalChanges,
} from '../repositories/journal.repository'
import type {
  JournalDetails,
  JournalEntry,
  JournalPageRequest,
  JournalPageResult,
  JournalSummary,
} from '../types/journal.types'
import { mapJournalDetails, mapJournalEntry } from './journal.mapper'

export function summarizeJournalPage(entries: JournalEntry[], totalCount: number): JournalSummary {
  const pageIncome = entries.reduce((total, entry) => {
    if (entry.type !== 'income') return total
    return total + (entry.isReversal ? -entry.amount : entry.amount)
  }, 0)
  const pageExpense = entries.reduce((total, entry) => {
    if (entry.type !== 'expense') return total
    return total + (entry.isReversal ? -entry.amount : entry.amount)
  }, 0)

  return {
    totalCount,
    pageIncome,
    pageExpense,
    pageNet: pageIncome - pageExpense,
  }
}

export function normalizeJournalDateRange(dateFrom: string, dateTo: string) {
  const from = dateFrom.trim()
  const to = dateTo.trim()

  if (from && to && from > to) {
    return { dateFrom: to, dateTo: from }
  }

  return { dateFrom: from, dateTo: to }
}

export async function getJournalPage(request: JournalPageRequest): Promise<JournalPageResult> {
  const pageSize = Math.min(Math.max(Math.trunc(request.pageSize), 1), 100)
  const page = Math.max(Math.trunc(request.page), 1)
  const dateRange = normalizeJournalDateRange(request.filters.dateFrom, request.filters.dateTo)
  const result = await findJournalEntries({
    offset: (page - 1) * pageSize,
    limit: pageSize,
    query: request.filters.query,
    type: request.filters.type,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
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

export function watchJournal(onChange: () => void): () => void {
  return subscribeToJournalChanges(onChange)
}

export async function getJournalDetails(entryId: string): Promise<JournalDetails | null> {
  const record = await findJournalDetails(entryId)
  return record ? mapJournalDetails(record) : null
}

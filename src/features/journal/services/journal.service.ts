import {
  findJournalDetails,
  findJournalEntries,
  reverseJournalEntry,
  subscribeToJournalChanges,
  type JournalDetailsRecord,
} from '../repositories/journal.repository'
import type {
  JournalDetails,
  JournalEntry,
  JournalPageRequest,
  JournalPageResult,
  JournalSummary,
} from '../types/journal.types'
import { mapJournalEntry } from './journal.mapper'

function effectiveAmount(entry: JournalEntry): number {
  return entry.isReversal ? -entry.amount : entry.amount
}

export function summarizeJournalPage(entries: JournalEntry[], totalCount: number): JournalSummary {
  const pageIncome = entries.reduce(
    (total, entry) => total + (entry.type === 'income' ? effectiveAmount(entry) : 0),
    0,
  )
  const pageExpense = entries.reduce(
    (total, entry) => total + (entry.type === 'expense' ? effectiveAmount(entry) : 0),
    0,
  )

  return {
    totalCount,
    pageIncome,
    pageExpense,
    pageNet: pageIncome - pageExpense,
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

export async function reverseEntry(sourceEntryId: string): Promise<string> {
  if (!sourceEntryId) throw new Error('معرف القيد مطلوب.')
  return reverseJournalEntry(sourceEntryId)
}

function relationValue<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function toAmount(value: number | string): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export function mapJournalDetails(record: JournalDetailsRecord): JournalDetails {
  const lines = (record.lines ?? []).map((line) => {
    const account = relationValue(line.account)
    return {
      id: line.id,
      lineNumber: line.line_number,
      accountCode: account?.code ?? '',
      accountName: account?.name_ar ?? 'حساب غير معروف',
      description: line.description ?? '',
      debit: toAmount(line.debit),
      credit: toAmount(line.credit),
    }
  })

  return {
    id: record.id,
    journalNumber: toAmount(record.journal_number),
    journalDate: record.journal_date,
    description: record.description,
    status: record.status === 'draft' || record.status === 'reversed' ? record.status : 'posted',
    projectName: relationValue(record.project)?.name ?? 'بدون مشروع',
    createdAt: record.created_at,
    postedAt: record.posted_at ?? '',
    totalDebit: lines.reduce((total, line) => total + line.debit, 0),
    totalCredit: lines.reduce((total, line) => total + line.credit, 0),
    lines,
  }
}

export async function getJournalDetails(entryId: string): Promise<JournalDetails | null> {
  const record = await findJournalDetails(entryId)
  return record ? mapJournalDetails(record) : null
}

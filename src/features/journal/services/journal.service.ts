import type { JournalEntry } from '../types/journal.types'
import { findJournalEntries, type JournalEntryRecord } from '../repositories/journal.repository'

function normalizeType(type: string): JournalEntry['type'] {
  return type === 'income' || type === 'i' ? 'income' : 'expense'
}

function getProjectName(project: JournalEntryRecord['project']): string {
  if (Array.isArray(project)) return project[0]?.name ?? 'بدون مشروع'
  return project?.name ?? 'بدون مشروع'
}

function mapJournalEntry(record: JournalEntryRecord): JournalEntry {
  return {
    id: record.id,
    sequence: record.seq ?? 0,
    entryDate: record.entry_date,
    projectName: getProjectName(record.project),
    type: normalizeType(record.type),
    category: record.category ?? '',
    description: record.description ?? '',
    contractor: record.contractor ?? '',
    paymentMethod: record.payment_method ?? '',
    amount: Number(record.amount),
  }
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const records = await findJournalEntries()
  return records.map(mapJournalEntry)
}

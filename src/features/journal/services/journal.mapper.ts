import { DataValidationError } from '../../../shared/errors/app-error'
import type { JournalEntryRecord } from '../repositories/journal.repository'
import type { JournalEntry, JournalEntryType } from '../types/journal.types'

function normalizeType(type: string): JournalEntryType {
  if (type === 'income' || type === 'i') return 'income'
  if (type === 'expense' || type === 'e') return 'expense'
  throw new DataValidationError(`نوع القيد غير صالح: ${type || 'فارغ'}`)
}

function getProjectName(project: JournalEntryRecord['project']): string {
  // Supabase can infer embedded relations as arrays without generated database types.
  // Normalize that transport detail here so it never leaks into the UI model.
  if (Array.isArray(project)) return project[0]?.name ?? 'بدون مشروع'
  return project?.name ?? 'بدون مشروع'
}

export function mapJournalEntry(record: JournalEntryRecord): JournalEntry {
  const amount = Number(record.amount)
  if (!Number.isFinite(amount)) throw new DataValidationError('مبلغ القيد غير صالح.')

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
    amount,
  }
}

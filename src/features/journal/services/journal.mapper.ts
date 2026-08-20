import { DataValidationError } from '../../../shared/errors/app-error'
import type { JournalDetailsRecord, JournalEntryRecord } from '../repositories/journal.repository'
import type { JournalDetails, JournalEntry, JournalEntryType } from '../types/journal.types'

function normalizeType(type: string): JournalEntryType {
  if (type === 'income' || type === 'i') return 'income'
  if (type === 'expense' || type === 'e') return 'expense'
  throw new DataValidationError(`نوع القيد غير صالح: ${type || 'فارغ'}`)
}

function normalizeStatus(status: string): JournalDetails['status'] {
  if (status === 'draft' || status === 'posted' || status === 'reversed') return status
  throw new DataValidationError(`حالة القيد غير صالحة: ${status || 'فارغة'}`)
}

function getProjectName(project: JournalEntryRecord['project']): string {
  // Supabase can infer embedded relations as arrays without generated database types.
  // Normalize that transport detail here so it never leaks into the UI model.
  if (Array.isArray(project)) return project[0]?.name ?? 'بدون مشروع'
  return project?.name ?? 'بدون مشروع'
}

function relationValue<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function toAmount(value: number | string): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export function mapJournalEntry(record: JournalEntryRecord): JournalEntry {
  const amount = Number(record.amount)
  if (!Number.isFinite(amount)) throw new DataValidationError('مبلغ القيد غير صالح.')
  const description = record.description ?? ''

  return {
    id: record.id,
    sequence: record.seq ?? 0,
    entryDate: record.entry_date,
    projectName: getProjectName(record.project),
    type: normalizeType(record.type),
    category: record.category ?? '',
    description,
    contractor: record.contractor ?? '',
    paymentMethod: record.payment_method ?? '',
    amount,
    isReversal: description.trimStart().startsWith('عكس:'),
  }
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
    status: normalizeStatus(record.status),
    projectName: relationValue(record.project)?.name ?? 'بدون مشروع',
    createdAt: record.created_at,
    postedAt: record.posted_at ?? '',
    totalDebit: lines.reduce((total, line) => total + line.debit, 0),
    totalCredit: lines.reduce((total, line) => total + line.credit, 0),
    lines,
  }
}

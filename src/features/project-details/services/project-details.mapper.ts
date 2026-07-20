import { DataValidationError } from '../../../shared/errors/app-error'
import type { ProjectDetailsRecord, ProjectEntryRecord } from '../repositories/project-details.repository'
import type { ProjectDetails, ProjectEntry, ProjectEntryType } from '../types/project-details.types'

function mapEntryType(type: string): ProjectEntryType {
  if (type === 'income' || type === 'i') return 'income'
  if (type === 'expense' || type === 'e') return 'expense'
  throw new DataValidationError(`نوع القيد غير صالح: ${type || 'فارغ'}`)
}

function getProjectName(project: ProjectEntryRecord['project']): string {
  if (Array.isArray(project)) return project[0]?.name ?? 'بدون مشروع'
  return project?.name ?? 'بدون مشروع'
}

export function mapProjectDetails(record: ProjectDetailsRecord): ProjectDetails {
  return {
    id: record.id,
    name: record.name,
    startDate: record.start_date ?? '—',
    endDate: record.close_date ?? '—',
    status: record.is_archived ? 'archived' : record.close_date ? 'completed' : 'active',
  }
}

export function mapProjectEntry(record: ProjectEntryRecord): ProjectEntry {
  const amount = Number(record.amount)
  if (!Number.isFinite(amount)) throw new DataValidationError('مبلغ القيد غير صالح.')

  return {
    id: record.id,
    sequence: record.seq ?? 0,
    entryDate: record.entry_date,
    projectName: getProjectName(record.project),
    type: mapEntryType(record.type),
    category: record.category ?? '',
    description: record.description ?? '',
    contractor: record.contractor ?? '',
    paymentMethod: record.payment_method ?? '',
    amount,
  }
}

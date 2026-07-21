import { DataValidationError } from '../../../shared/errors/app-error'
import type { Project, ProjectRecord, ProjectStatus } from '../types/project.types'

function toFiniteNumber(
  value: number | string | null | undefined,
  fieldName: string,
): number {
  if (value === null || value === undefined || value === '') return 0

  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new DataValidationError(`${fieldName} غير صالح.`)
  }

  return number
}

function normalizeProgress(value: number | string | null | undefined): number {
  const progress = toFiniteNumber(value, 'نسبة إنجاز المشروع')
  return Math.min(100, Math.max(0, progress))
}

function normalizeStatus(record: ProjectRecord): ProjectStatus {
  if (record.is_archived) return 'archived'

  switch (record.status) {
    case 'active':
    case 'completed':
    case 'paused':
    case 'archived':
      return record.status
    case 'closed':
      return 'completed'
    case 'open':
    case null:
    case undefined:
    case '':
      return 'active'
    default:
      return 'active'
  }
}

export function mapProject(record: ProjectRecord): Project {
  if (!record.id || !record.name?.trim()) {
    throw new DataValidationError('بيانات المشروع الأساسية غير مكتملة.')
  }

  return {
    id: record.id,
    name: record.name.trim(),
    client: record.client_name?.trim() ?? '',
    location: record.location?.trim() ?? '',
    manager: record.manager?.trim() ?? '',
    status: normalizeStatus(record),
    progress: normalizeProgress(record.progress),
    contractValue: toFiniteNumber(record.contract_value, 'قيمة عقد المشروع'),
    received: toFiniteNumber(record.received, 'إجمالي المحصل'),
    spent: toFiniteNumber(record.spent, 'إجمالي المصروف'),
    startDate: record.start_date ?? '',
    endDate: record.end_date ?? record.close_date ?? '',
  }
}

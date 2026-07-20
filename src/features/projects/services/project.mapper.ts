import { DataValidationError } from '../../../shared/errors/app-error'
import type { Project, ProjectRecord, ProjectStatus } from '../types/project.types'

function normalizeStatus(status: string): ProjectStatus {
  if (
    status === 'active' ||
    status === 'completed' ||
    status === 'paused' ||
    status === 'archived'
  )
    return status
  // DB default is 'open' — map legacy values gracefully
  if (status === 'open') return 'active'
  throw new DataValidationError(`حالة المشروع غير صالحة: ${status || 'فارغة'}`)
}

export function mapProject(record: ProjectRecord): Project {
  const contractValue = Number(record.contract_value)
  const received      = Number(record.received)
  const spent         = Number(record.spent)

  if (!Number.isFinite(contractValue)) throw new DataValidationError('قيمة العقد غير صالحة.')
  if (!Number.isFinite(received))      throw new DataValidationError('المبلغ المحصّل غير صالح.')
  if (!Number.isFinite(spent))         throw new DataValidationError('المبلغ المصروف غير صالح.')

  return {
    id:           record.id,
    name:         record.name,
    client:       record.client_name ?? '',
    location:     record.location    ?? '',
    manager:      record.manager     ?? '',
    status:       normalizeStatus(record.status),
    progress:     record.progress,
    contractValue,
    received,
    spent,
    startDate:    record.start_date  ?? '',
    endDate:      record.end_date    ?? '',
  }
}

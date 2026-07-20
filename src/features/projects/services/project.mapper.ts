import type { ProjectRecord } from '../repositories/projects.repository'
import type { Project, ProjectStatus } from '../types/project.types'

function toProjectStatus(record: ProjectRecord): ProjectStatus {
  if (record.is_archived) return 'archived'
  if (record.close_date) return 'completed'
  return 'active'
}

export function mapProjectRecord(record: ProjectRecord): Project {
  return {
    id: record.id,
    name: record.name,
    client: '—',
    location: '—',
    manager: '—',
    status: toProjectStatus(record),
    progress: record.close_date ? 100 : 0,
    contractValue: 0,
    received: 0,
    spent: 0,
    startDate: record.start_date ?? '—',
    endDate: record.close_date ?? '—',
  }
}

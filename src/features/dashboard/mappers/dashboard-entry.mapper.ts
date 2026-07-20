import type { DashboardRecentEntryRecord } from '../repositories/dashboard-recent-entries.repository'
import type { DashboardEntry } from '../types/dashboard.types'
import {
  formatDashboardDate,
  formatDashboardNumber,
  toDashboardAmount,
} from '../utils/dashboard-formatters'

function getProjectName(projects: DashboardRecentEntryRecord['projects']): string {
  if (Array.isArray(projects)) return projects[0]?.name ?? 'مشروع غير معروف'
  return projects?.name ?? 'مشروع غير معروف'
}

export function mapDashboardEntry(record: DashboardRecentEntryRecord): DashboardEntry {
  return {
    id: record.seq ? `#${record.seq}` : record.id,
    project: getProjectName(record.projects),
    description: record.description?.trim() || 'بدون بيان',
    date: formatDashboardDate(record.entry_date),
    amount: formatDashboardNumber(toDashboardAmount(record.amount)),
    type: record.type === 'i' ? 'income' : 'expense',
  }
}

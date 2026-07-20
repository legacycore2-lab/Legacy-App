import type { DashboardRecentEntryRecord } from '../repositories/dashboard-recent-entries.repository'
import type { DashboardEntry } from '../types/dashboard.types'
import { formatDashboardDate, formatDashboardNumber, toDashboardAmount } from '../utils/dashboard-formatters'

export function mapDashboardEntry(
  record: DashboardRecentEntryRecord,
  projectName = 'مشروع غير معروف',
): DashboardEntry {
  return {
    id: record.seq ? `#${record.seq}` : record.id,
    project: projectName,
    description: record.description?.trim() || 'بدون بيان',
    date: formatDashboardDate(record.entry_date ?? null),
    amount: formatDashboardNumber(toDashboardAmount(record.amount ?? null)),
    type: record.type === 'i' ? 'income' : 'expense',
  }
}

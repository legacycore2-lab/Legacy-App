import type { DashboardRecentEntryRecord } from '../repositories/dashboard-recent-entries.repository'
import type { DashboardEntry } from '../types/dashboard.types'

const currency = new Intl.NumberFormat('ar-EG')

function getProjectName(projects: DashboardRecentEntryRecord['projects']): string {
  if (Array.isArray(projects)) return projects[0]?.name ?? 'مشروع غير معروف'
  return projects?.name ?? 'مشروع غير معروف'
}

function formatAmount(value: number | string | null): string {
  const amount = Number(value)
  return currency.format(Number.isFinite(amount) ? amount : 0)
}

export function mapDashboardEntry(record: DashboardRecentEntryRecord): DashboardEntry {
  return {
    id: record.seq ? `#${record.seq}` : record.id,
    project: getProjectName(record.projects),
    description: record.description?.trim() || 'بدون بيان',
    date: record.entry_date || 'تاريخ غير مسجل',
    amount: formatAmount(record.amount),
    type: record.type === 'i' ? 'income' : 'expense',
  }
}

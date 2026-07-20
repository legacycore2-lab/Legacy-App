import type { DashboardProjectRecord } from '../repositories/dashboard-projects.repository'
import type { DashboardProject } from '../types/dashboard.types'
import { formatDashboardCurrency } from '../utils/dashboard-formatters'

function normalizeProgress(value: number | null, isCompleted: boolean): number {
  if (isCompleted) return 100
  if (!Number.isFinite(value)) return 0
  return Math.min(99, Math.max(0, Math.round(value ?? 0)))
}

export function mapDashboardProject(record: DashboardProjectRecord, balance: number): DashboardProject {
  const isCompleted = Boolean(record.close_date)

  return {
    id: record.id,
    name: record.name,
    client: record.client_name?.trim() || 'عميل غير مسجل',
    balance: formatDashboardCurrency(balance),
    progress: normalizeProgress(record.progress, isCompleted),
    status: isCompleted ? 'مكتمل' : 'جاري',
  }
}

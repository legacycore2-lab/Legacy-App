import type { DashboardProjectRecord } from '../repositories/dashboard-projects.repository'
import type { DashboardProject } from '../types/dashboard.types'
import { formatDashboardCurrency } from '../utils/dashboard-formatters'

export function mapDashboardProject(
  record: DashboardProjectRecord,
  balance: number,
  progress: number,
): DashboardProject {
  const isCompleted = Boolean(record.close_date)

  return {
    id: record.id,
    name: record.name,
    client: 'غير متاح في بيانات المشروع',
    balance: formatDashboardCurrency(balance),
    progress,
    status: isCompleted ? 'مكتمل' : 'جاري',
  }
}

import type { DashboardProjectRecord } from '../repositories/dashboard-projects.repository'
import type { DashboardProject } from '../types/dashboard.types'

export function mapDashboardProject(record: DashboardProjectRecord): DashboardProject {
  const isCompleted = Boolean(record.close_date)

  return {
    id: record.id,
    name: record.name,
    client: 'غير مسجل',
    balance: 'غير متاح',
    progress: isCompleted ? 100 : 0,
    status: isCompleted ? 'مكتمل' : 'جاري',
  }
}

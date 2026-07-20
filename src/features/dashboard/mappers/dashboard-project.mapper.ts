import type { DashboardProjectRecord } from '../repositories/dashboard-projects.repository'
import type { DashboardProject } from '../types/dashboard.types'

const currency = new Intl.NumberFormat('ar-EG')

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
    balance: `${currency.format(balance)} ج.م`,
    progress,
    status: isCompleted ? 'مكتمل' : 'جاري',
  }
}

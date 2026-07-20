import type { DashboardProjectRecord } from '../repositories/dashboard-projects.repository'
import type { DashboardProject } from '../types/dashboard.types'

const currency = new Intl.NumberFormat('ar-EG')

export function mapDashboardProject(
  record: DashboardProjectRecord,
  balance: number,
): DashboardProject {
  const isCompleted = Boolean(record.close_date)

  return {
    id: record.id,
    name: record.name,
    client: 'غير مسجل',
    balance: `${currency.format(balance)} ج.م`,
    progress: isCompleted ? 100 : 0,
    status: isCompleted ? 'مكتمل' : 'جاري',
  }
}

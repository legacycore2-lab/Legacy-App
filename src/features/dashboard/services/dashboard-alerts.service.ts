import type { DashboardAlert, DashboardEntry, DashboardProject } from '../types/dashboard.types'

const HIGH_EXPENSE_THRESHOLD = 40_000
const CLOSEOUT_PROGRESS_THRESHOLD = 90

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, '')) || 0
}

export function buildDashboardAlerts(
  projects: DashboardProject[],
  entries: DashboardEntry[],
): DashboardAlert[] {
  const alerts: DashboardAlert[] = []
  const projectsWithActivity = new Set(entries.map((entry) => entry.project))

  projects.forEach((project) => {
    if (parseAmount(project.balance) < 0) {
      alerts.push({
        id: `negative-balance-${project.name}`,
        title: `رصيد مشروع ${project.name} بالسالب`,
        description: 'يحتاج مراجعة الإيرادات والمصروفات قبل إضافة التزامات جديدة.',
        tone: 'danger',
      })
    }

    if (project.progress >= CLOSEOUT_PROGRESS_THRESHOLD) {
      alerts.push({
        id: `closeout-${project.name}`,
        title: `مراجعة إقفال مشروع ${project.name}`,
        description: `نسبة التنفيذ وصلت إلى ${project.progress}% وتحتاج مراجعة المستخلصات والرصيد.`,
        tone: 'warning',
      })
    }

    if (!projectsWithActivity.has(project.name)) {
      alerts.push({
        id: `missing-activity-${project.name}`,
        title: `لا توجد حركة حديثة على مشروع ${project.name}`,
        description: 'راجع ما إذا كان المشروع يحتاج قيدًا أو تحديثًا لحالته.',
        tone: 'warning',
      })
    }
  })

  entries
    .filter((entry) => entry.type === 'expense' && parseAmount(entry.amount) >= HIGH_EXPENSE_THRESHOLD)
    .forEach((entry) => {
      alerts.push({
        id: `high-expense-${entry.id}`,
        title: `مصروف مرتفع في مشروع ${entry.project}`,
        description: `${entry.description} بقيمة ${entry.amount} ويحتاج مراجعة مستنداته.`,
        tone: 'danger',
      })
    })

  return alerts.slice(0, 5)
}

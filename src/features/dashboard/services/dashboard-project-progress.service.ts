import type { DashboardProjectRecord } from '../repositories/dashboard-projects.repository'

function parseProjectDate(value: string | null): Date | null {
  if (!value) return null

  const slashDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashDate) {
    const [, day, month, year] = slashDate
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function calculateDashboardProjectProgress(
  project: DashboardProjectRecord,
  now: Date = new Date(),
): number {
  if (project.close_date) return 100

  const startDate = parseProjectDate(project.start_date)
  if (!startDate || startDate.getTime() >= now.getTime()) return 0

  const elapsedDays = Math.floor((now.getTime() - startDate.getTime()) / 86_400_000)
  return Math.min(95, Math.max(5, Math.round(elapsedDays / 3)))
}

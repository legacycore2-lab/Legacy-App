const arabicNumberFormatter = new Intl.NumberFormat('ar-EG')
const arabicDateFormatter = new Intl.DateTimeFormat('ar-EG', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function toDashboardAmount(value: number | string | null): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export function formatDashboardNumber(value: number): string {
  return arabicNumberFormatter.format(value)
}

export function formatDashboardCurrency(value: number): string {
  return `${formatDashboardNumber(value)} ج.م`
}

export function formatDashboardDate(value: string | null): string {
  if (!value) return 'تاريخ غير مسجل'

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'تاريخ غير مسجل' : arabicDateFormatter.format(date)
}

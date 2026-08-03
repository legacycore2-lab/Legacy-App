const accountingDateFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const timestampFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/

export function isValidDateKey(value: string): boolean {
  const match = dateKeyPattern.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function formatAccountingDate(
  value: string | null | undefined,
  fallback = 'غير محدد',
): string {
  if (!value) return fallback
  const key = value.slice(0, 10)
  if (!isValidDateKey(key)) return value

  const [year, month, day] = key.split('-').map(Number)
  return accountingDateFormatter.format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}

export function formatTimestamp(
  value: string | Date | null | undefined,
  fallback = 'غير محدد',
): string {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : timestampFormatter.format(date)
}

export function formatLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

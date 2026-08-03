const egpNumberFormatter = new Intl.NumberFormat('ar-EG', {
  maximumFractionDigits: 2,
})

const egpIntegerFormatter = new Intl.NumberFormat('ar-EG', {
  maximumFractionDigits: 0,
})

export type MoneyFormatOptions = {
  maximumFractionDigits?: 0 | 2
  fallback?: string
  includeCurrency?: boolean
}

export function formatMoney(
  value: number | string | null | undefined,
  options: MoneyFormatOptions = {},
): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return options.fallback ?? '—'

  const formatter = options.maximumFractionDigits === 0 ? egpIntegerFormatter : egpNumberFormatter
  const formatted = formatter.format(amount)
  return options.includeCurrency === false ? formatted : `${formatted} ج.م`
}

export function formatMoneyInteger(value: number | string | null | undefined, fallback = '—'): string {
  return formatMoney(value, { maximumFractionDigits: 0, fallback })
}

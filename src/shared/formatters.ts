// Western numerals with comma separators — standard accounting format (816,000 ج.م)
// 'ar-EG' produces Eastern Arabic-Indic digits (٨١٦٠٠٠) which are harder to scan
const egpNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const egpIntegerFormatter = new Intl.NumberFormat('en-US', {
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

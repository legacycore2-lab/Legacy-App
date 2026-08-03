import { describe, expect, it } from 'vitest'
import { formatMoney, formatMoneyInteger } from './formatters'

describe('formatMoney', () => {
  it('formats EGP with Arabic locale and currency label', () => {
    expect(formatMoney(16000)).toContain('ج.م')
  })

  it('preserves negative values', () => {
    expect(formatMoney(-16000)).toContain('-')
  })

  it('supports zero', () => {
    expect(formatMoney(0)).toContain('٠')
  })

  it('returns fallback for invalid values', () => {
    expect(formatMoney('invalid', { fallback: 'غير متاح' })).toBe('غير متاح')
  })

  it('can omit currency label', () => {
    expect(formatMoney(1000, { includeCurrency: false })).not.toContain('ج.م')
  })
})

describe('formatMoneyInteger', () => {
  it('does not render decimal digits', () => {
    const formatted = formatMoneyInteger(1000.75)
    expect(formatted).not.toContain('٫')
  })
})

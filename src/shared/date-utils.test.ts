import { describe, expect, it } from 'vitest'
import { formatAccountingDate, formatLocalDateKey, formatTimestamp, isValidDateKey } from './date-utils'

describe('isValidDateKey', () => {
  it('accepts a valid leap day', () => expect(isValidDateKey('2028-02-29')).toBe(true))
  it('rejects an invalid leap day', () => expect(isValidDateKey('2027-02-29')).toBe(false))
  it('rejects impossible dates', () => expect(isValidDateKey('2026-02-31')).toBe(false))
  it('rejects non date keys', () => expect(isValidDateKey('not-a-date')).toBe(false))
})

describe('formatAccountingDate', () => {
  it('formats YYYY-MM-DD without local timezone shifting', () => {
    const formatted = formatAccountingDate('2026-08-01')
    expect(formatted).toContain('٢٠٢٦')
  })

  it('uses fallback for empty values', () => {
    expect(formatAccountingDate('', '—')).toBe('—')
  })
})

describe('formatTimestamp', () => {
  it('formats valid timestamps', () => {
    expect(formatTimestamp('2026-08-03T06:00:00Z')).not.toBe('2026-08-03T06:00:00Z')
  })

  it('returns the original invalid value', () => {
    expect(formatTimestamp('invalid')).toBe('invalid')
  })
})

describe('formatLocalDateKey', () => {
  it('uses local calendar parts', () => {
    const date = new Date(2026, 0, 2, 23, 30)
    expect(formatLocalDateKey(date)).toBe('2026-01-02')
  })
})

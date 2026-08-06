// Legacy Core ERP
// pdf-formatters.test.ts — PDF-only formatting utilities

import { describe, expect, it } from 'vitest'
import { formatPdfDate, formatPdfMoneyInteger, formatPdfNumber } from './pdf-formatters'

describe('formatPdfMoneyInteger', () => {
  it('produces western numerals with comma separators', () => {
    expect(formatPdfMoneyInteger(816000)).toBe('816,000 ج.م')
  })

  it('appends EGP label', () => {
    expect(formatPdfMoneyInteger(1000)).toContain('ج.م')
  })

  it('handles negative values', () => {
    expect(formatPdfMoneyInteger(-250000)).toBe('-250,000 ج.م')
  })

  it('handles zero', () => {
    expect(formatPdfMoneyInteger(0)).toBe('0 ج.م')
  })

  it('returns fallback for null', () => {
    expect(formatPdfMoneyInteger(null)).toBe('—')
  })

  it('returns fallback for undefined', () => {
    expect(formatPdfMoneyInteger(undefined)).toBe('—')
  })

  it('returns fallback for non-numeric strings', () => {
    expect(formatPdfMoneyInteger('abc')).toBe('—')
  })

  it('accepts numeric strings', () => {
    expect(formatPdfMoneyInteger('150000')).toBe('150,000 ج.م')
  })

  it('does NOT produce Eastern Arabic-Indic digits', () => {
    const result = formatPdfMoneyInteger(816000)
    expect(result).not.toMatch(/[٠١٢٣٤٥٦٧٨٩]/)
  })
})

describe('formatPdfNumber', () => {
  it('formats with two decimal places', () => {
    expect(formatPdfNumber(1234.5)).toBe('1,234.50')
  })

  it('returns fallback for null', () => {
    expect(formatPdfNumber(null)).toBe('—')
  })

  it('returns fallback for undefined', () => {
    expect(formatPdfNumber(undefined)).toBe('—')
  })
})

describe('formatPdfDate', () => {
  it('returns a non-empty string', () => {
    expect(formatPdfDate()).toBeTruthy()
  })

  it('contains Arabic month name for August', () => {
    const knownDate = new Date('2026-08-06')
    expect(formatPdfDate(knownDate)).toContain('أغسطس')
  })

  it('contains the year in Eastern Arabic numerals (ar-EG standard)', () => {
    const knownDate = new Date('2026-08-06')
    // ar-EG produces Eastern Arabic-Indic digits — ٢٠٢٦ not 2026
    expect(formatPdfDate(knownDate)).toContain('٢٠٢٦')
  })
})

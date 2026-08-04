import { describe, expect, it } from 'vitest'
import {
  containsArabic,
  prepareArabicText,
  prepareTableHeaders,
  prepareTableRow,
} from './arabic-text.service'

describe('containsArabic', () => {
  it('detects Arabic characters', () => {
    expect(containsArabic('محمود مصباح')).toBe(true)
    expect(containsArabic('تاج سلطان')).toBe(true)
    expect(containsArabic('الأرباح والخسائر')).toBe(true)
  })

  it('returns false for Latin-only strings', () => {
    expect(containsArabic('Legacy Core')).toBe(false)
    expect(containsArabic('2026-08-05')).toBe(false)
    expect(containsArabic('1,234,567')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(containsArabic('')).toBe(false)
  })
})

describe('prepareArabicText', () => {
  it('returns non-Arabic text unchanged', () => {
    expect(prepareArabicText('Legacy Core')).toBe('Legacy Core')
    expect(prepareArabicText('2026-08-05')).toBe('2026-08-05')
  })

  it('reshapes Arabic characters (produces Presentation Form glyphs)', () => {
    const result = prepareArabicText('محمود')
    // After reshaping + reversing, should contain Arabic Presentation Forms (U+FB50–U+FEFF)
    const hasPresentationForms = [...result].some(
      (ch) => ch.charCodeAt(0) >= 0xfb50 && ch.charCodeAt(0) <= 0xfeff,
    )
    expect(hasPresentationForms).toBe(true)
  })

  it('reverses glyph order for RTL rendering in LTR engine', () => {
    const input = 'محمود'
    const result = prepareArabicText(input)
    // Result should not equal input (reshaped + reversed)
    expect(result).not.toBe(input)
    // Length should be the same (reshaping maps 1:1 to presentation forms)
    expect([...result].length).toBe([...input].length)
  })

  it('processes "محمود مصباح" without throwing', () => {
    expect(() => prepareArabicText('محمود مصباح')).not.toThrow()
    const result = prepareArabicText('محمود مصباح')
    expect(result.length).toBeGreaterThan(0)
  })

  it('processes "تاج سلطان" without throwing', () => {
    expect(() => prepareArabicText('تاج سلطان')).not.toThrow()
  })
})

describe('prepareTableHeaders', () => {
  it('processes Arabic headers', () => {
    const headers = ['المشروع', 'الإيرادات', 'المصروفات']
    const result = prepareTableHeaders(headers)
    expect(result).toHaveLength(3)
    // Each should be processed (not identical to input for Arabic strings)
    result.forEach((h, i) => {
      expect(h).not.toBe(headers[i])
    })
  })

  it('leaves Latin headers unchanged', () => {
    const headers = ['Project', 'Income', 'Expense']
    const result = prepareTableHeaders(headers)
    expect(result).toEqual(headers)
  })
})

describe('prepareTableRow', () => {
  it('processes Arabic cells and leaves numbers unchanged', () => {
    const row = ['محمود مصباح', '1,234,567', 'تاج سلطان', 42]
    const result = prepareTableRow(row)
    expect(result).toHaveLength(4)
    // Arabic cells should be transformed
    expect(result[0]).not.toBe('محمود مصباح')
    expect(result[2]).not.toBe('تاج سلطان')
    // Latin/number cells should be unchanged
    expect(result[1]).toBe('1,234,567')
    expect(result[3]).toBe('42')
  })

  it('handles empty cells gracefully', () => {
    const row = ['', '—', 0]
    expect(() => prepareTableRow(row)).not.toThrow()
    const result = prepareTableRow(row)
    expect(result[0]).toBe('')
    expect(result[1]).toBe('—')
    expect(result[2]).toBe('0')
  })
})

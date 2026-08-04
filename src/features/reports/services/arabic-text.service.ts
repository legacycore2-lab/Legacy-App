import { convertArabic } from 'arabic-reshaper'

const ARABIC_RANGE = /[\u0600-\u06FF\u200C-\u200F]/

/**
 * Checks whether a string contains Arabic characters.
 */
export function containsArabic(text: string): boolean {
  return ARABIC_RANGE.test(text)
}

/**
 * Prepares Arabic text for rendering in jsPDF.
 *
 * jsPDF with an embedded Arabic font (Amiri) renders reshaped Arabic glyphs
 * correctly when text alignment is set to 'right'. No character-level or
 * segment-level reversal is needed — the font engine handles glyph ordering.
 *
 * Steps:
 * 1. Reshape — converts isolated Unicode code points to their correct
 *    connected Presentation Form glyphs (e.g. م + ح → ﻣﺤ).
 *
 * Non-Arabic strings are returned unchanged.
 */
export function prepareArabicText(text: string): string {
  if (!text || !containsArabic(text)) return text
  return convertArabic(text)
}

/**
 * Alias of prepareArabicText — kept for API consistency.
 */
export function prepareArabicPhrase(text: string): string {
  return prepareArabicText(text)
}

/**
 * Prepares a row of table cells for Arabic-aware rendering.
 */
export function prepareTableRow(cells: (string | number)[]): string[] {
  return cells.map((cell) => {
    const s = String(cell)
    return containsArabic(s) ? prepareArabicText(s) : s
  })
}

/**
 * Prepares table headers for Arabic-aware rendering.
 */
export function prepareTableHeaders(headers: string[]): string[] {
  return headers.map((h) => (containsArabic(h) ? prepareArabicText(h) : h))
}

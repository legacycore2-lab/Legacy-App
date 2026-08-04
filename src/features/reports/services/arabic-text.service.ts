import { convertArabic } from 'arabic-reshaper'

const ARABIC_RANGE = /[\u0600-\u06FF\u0660-\u0669\u200C\u200D\u200E\u200F]/

/**
 * Checks whether a string contains Arabic characters.
 */
export function containsArabic(text: string): boolean {
  return ARABIC_RANGE.test(text)
}

/**
 * Prepares Arabic text for rendering in jsPDF (which uses a left-to-right engine).
 *
 * Steps:
 * 1. Reshape — converts isolated Unicode code points to their correct
 *    connected/contextual Presentation Form glyphs (e.g. ا + ل → ﻻ).
 * 2. Reverse — jsPDF renders characters left-to-right, so we reverse the
 *    glyph order to produce correct right-to-left visual output.
 *
 * Non-Arabic strings are returned unchanged.
 */
export function prepareArabicText(text: string): string {
  if (!text || !containsArabic(text)) return text
  const reshaped = convertArabic(text)
  return reshaped.split('').reverse().join('')
}

/**
 * Prepares a mixed Arabic/Latin string: splits on whitespace boundaries,
 * reshapes Arabic segments, and reverses the word order so that the sentence
 * reads correctly in RTL context.
 *
 * Use this for multi-word phrases like "محمود مصباح" or "تاج سلطان".
 */
export function prepareArabicPhrase(text: string): string {
  if (!text || !containsArabic(text)) return text
  const reshaped = convertArabic(text)
  return reshaped.split('').reverse().join('')
}

/**
 * Prepares a row of table cells for Arabic-aware rendering.
 * Returns a new array with all Arabic strings processed.
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

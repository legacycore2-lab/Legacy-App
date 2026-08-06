/**
 * pdf-formatters.ts
 *
 * PDF-only formatting utilities.
 * These formatters intentionally use en-US locale to produce western
 * numerals and comma separators (e.g. 816,000) for accounting readability
 * inside generated PDF documents.
 *
 * ⚠️  Do NOT import from this file in any UI component or shared formatter.
 *     For UI number display use shared/formatters (ar-EG, Eastern Arabic numerals).
 */

// ── Number formatters ─────────────────────────────────────────────────────────

const pdfIntegerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const pdfDecimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formats a monetary integer for PDF output.
 * Returns western numerals with comma separators and EGP label.
 * Example: 816000 → "816,000 ج.م"
 */
export function formatPdfMoneyInteger(value: number | string | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined) return fallback
  const amount = Number(value)
  if (!Number.isFinite(amount)) return fallback
  return `${pdfIntegerFormatter.format(amount)} ج.م`
}

/**
 * Formats a raw number for PDF output (no currency label).
 * Example: 1234567 → "1,234,567.00"
 */
export function formatPdfNumber(value: number | string | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined) return fallback
  const amount = Number(value)
  if (!Number.isFinite(amount)) return fallback
  return pdfDecimalFormatter.format(amount)
}

// ── Date formatter ────────────────────────────────────────────────────────────

/**
 * Formats a date as full Arabic text for PDF headers.
 * Day and year are rendered in Eastern Arabic-Indic digits (as produced by ar-EG),
 * month is rendered as full Arabic text — the correct standard for Arabic documents.
 *
 * Example output: "٦ أغسطس ٢٠٢٦"
 */
export function formatPdfDate(date: Date = new Date()): string {
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

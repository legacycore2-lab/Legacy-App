import { renderPdfTemplate } from './pdf-template.renderer'
import { prepareArabicText } from './arabic-text.service'
import type { PdfExportPayload, PdfFilenameOptions } from '../types/pdf-export.types'

// ── Filename builder ──────────────────────────────────────────────────────────

export function buildPdfFilename({ reportKey, contextLabel, date }: PdfFilenameOptions): string {
  const today = date ?? new Date().toISOString().slice(0, 10)
  const parts = [reportKey]
  if (contextLabel) {
    const slug = contextLabel
      .trim()
      .toLocaleLowerCase('ar-EG')
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .slice(0, 40)
    if (slug) parts.push(slug)
  }
  parts.push(today)
  return `${parts.join('-')}.pdf`
}

// ── Active filters label builder ──────────────────────────────────────────────

export function buildFiltersLabel(activeFilters: PdfExportPayload['activeFilters']): string {
  if (activeFilters.length === 0) return 'لا توجد فلاتر مطبقة'
  return activeFilters.map((f) => `${f.label}: ${f.value}`).join('  |  ')
}

// ── Core renderer — delegates to unified template ─────────────────────────────

export async function renderPdf(payload: PdfExportPayload) {
  const infoItems =
    payload.activeFilters.length > 0
      ? payload.activeFilters.map((f) => ({ label: f.label, value: f.value }))
      : undefined

  return renderPdfTemplate({
    orientation: 'landscape',
    companyName: payload.companyName,
    reportCode: `${payload.activeTab.toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    reportTitle: payload.reportTitle,
    reportSubtitle: buildFiltersLabel(payload.activeFilters),
    infoItems,
    kpis: payload.kpis.map((k) => ({ label: k.label, value: k.value })),
    tables: payload.tables.map((t) => ({
      title: t.title,
      headers: t.headers,
      rows: t.rows,
    })),
  })
}

// ── Download trigger ──────────────────────────────────────────────────────────

export async function downloadPdf(payload: PdfExportPayload, filename: string): Promise<void> {
  const doc = await renderPdf(payload)
  doc.save(filename)
}

// ── Arabic text helper (kept for backward compat) ─────────────────────────────

export { prepareArabicText }

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PdfExportPayload, PdfFilenameOptions } from '../types/pdf-export.types'

const COMPANY_NAME = 'Legacy Core'

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

// ── Core PDF renderer ─────────────────────────────────────────────────────────

export function renderPdf(payload: PdfExportPayload): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // RTL — jsPDF doesn't natively flip text direction, but we set R-to-L manually
  // via column alignment. Arabic glyphs render correctly with the default font
  // when the text is set; for production, embed an Arabic font (e.g. Amiri).
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 14

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(COMPANY_NAME, margin, y)
  doc.text(payload.exportDate, pageW - margin, y, { align: 'right' })

  y += 7
  doc.setFontSize(16)
  doc.setTextColor(30)
  doc.text(payload.reportTitle, pageW / 2, y, { align: 'center' })

  y += 6
  doc.setFontSize(8)
  doc.setTextColor(140)
  const filtersText = buildFiltersLabel(payload.activeFilters)
  doc.text(filtersText, pageW / 2, y, { align: 'center', maxWidth: pageW - margin * 2 })

  y += 8

  // ── KPIs row ──────────────────────────────────────────────────────────────
  if (payload.kpis.length > 0) {
    const kpiW = (pageW - margin * 2) / payload.kpis.length
    doc.setFontSize(8)
    payload.kpis.forEach((kpi, i) => {
      const x = margin + i * kpiW + kpiW / 2
      doc.setTextColor(80)
      doc.text(kpi.label, x, y, { align: 'center' })
      doc.setFontSize(11)
      doc.setTextColor(30)
      doc.text(kpi.value, x, y + 5, { align: 'center' })
      doc.setFontSize(8)
    })
    y += 14
  }

  // ── Tables ────────────────────────────────────────────────────────────────
  for (const table of payload.tables) {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      y = 14
    }

    doc.setFontSize(10)
    doc.setTextColor(50)
    doc.text(table.title, margin, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [table.headers],
      body: table.rows.map((row) => row.map(String)),
      styles: { fontSize: 7, cellPadding: 2, halign: 'right' },
      headStyles: { fillColor: [41, 98, 255], textColor: 255, halign: 'right' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      didDrawPage: () => {
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y
      },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y
    y += 8
  }

  return doc
}

// ── Download trigger (side-effectful — kept here, not in component) ───────────

export function downloadPdf(payload: PdfExportPayload, filename: string): void {
  const doc = renderPdf(payload)
  doc.save(filename)
}

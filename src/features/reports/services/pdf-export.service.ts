import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ARABIC_FONT_NAME, registerArabicFont } from './pdf-font.service'
import { prepareArabicText, prepareTableHeaders, prepareTableRow } from './arabic-text.service'
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

// ── Core PDF renderer (async — loads font lazily) ─────────────────────────────

export async function renderPdf(payload: PdfExportPayload): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Load and register the Arabic font before any text rendering
  await registerArabicFont(doc)

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 14

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.text(payload.companyName, margin, y)
  doc.text(prepareArabicText(payload.exportDate), pageW - margin, y, { align: 'right' })

  y += 8
  doc.setFontSize(16)
  doc.setTextColor(30)
  doc.text(prepareArabicText(payload.reportTitle), pageW / 2, y, { align: 'center' })

  y += 6
  doc.setFontSize(8)
  doc.setTextColor(140)
  const filtersText = buildFiltersLabel(payload.activeFilters)
  doc.text(prepareArabicText(filtersText), pageW / 2, y, {
    align: 'center',
    maxWidth: pageW - margin * 2,
  })

  y += 10

  // ── KPIs row ──────────────────────────────────────────────────────────────
  if (payload.kpis.length > 0) {
    const kpiW = (pageW - margin * 2) / payload.kpis.length
    payload.kpis.forEach((kpi, i) => {
      const x = margin + i * kpiW + kpiW / 2
      doc.setFontSize(8)
      doc.setTextColor(80)
      doc.setFont(ARABIC_FONT_NAME, 'normal')
      doc.text(prepareArabicText(kpi.label), x, y, { align: 'center' })
      doc.setFontSize(11)
      doc.setTextColor(30)
      doc.text(prepareArabicText(kpi.value), x, y + 6, { align: 'center' })
    })
    y += 16
  }

  // ── Tables ────────────────────────────────────────────────────────────────
  for (const table of payload.tables) {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      y = 14
    }

    doc.setFontSize(10)
    doc.setTextColor(50)
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.text(prepareArabicText(table.title), margin, y)
    y += 4

    const preparedHeaders = prepareTableHeaders(table.headers)
    const preparedRows = table.rows.map(prepareTableRow)

    autoTable(doc, {
      startY: y,
      head: [preparedHeaders],
      body: preparedRows,
      styles: {
        font: ARABIC_FONT_NAME,
        fontStyle: 'normal',
        fontSize: 7,
        cellPadding: 2,
        halign: 'right',
      },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        font: ARABIC_FONT_NAME,
        fontStyle: 'bold',
        halign: 'right',
      },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y
    y += 8
  }

  return doc
}

// ── Download trigger ──────────────────────────────────────────────────────────

export async function downloadPdf(payload: PdfExportPayload, filename: string): Promise<void> {
  const doc = await renderPdf(payload)
  doc.save(filename)
}

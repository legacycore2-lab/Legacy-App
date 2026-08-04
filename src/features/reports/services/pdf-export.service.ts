import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ARABIC_FONT_NAME, registerArabicFont } from './pdf-font.service'
import { prepareArabicText, prepareTableHeaders, prepareTableRow } from './arabic-text.service'
import type { PdfExportPayload, PdfFilenameOptions } from '../types/pdf-export.types'

// ── Design tokens ─────────────────────────────────────────────────────────────

const COLOR = {
  navy: [15, 52, 96] as [number, number, number],
  teal: [22, 160, 133] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  kpiBg: [248, 250, 253] as [number, number, number],
  rowAlt: [247, 249, 252] as [number, number, number],
  border: [210, 218, 230] as [number, number, number],
  shadow: [220, 228, 240] as [number, number, number],
  textDark: [20, 30, 48] as [number, number, number],
  textMid: [80, 95, 115] as [number, number, number],
  textLight: [150, 165, 180] as [number, number, number],
  green: [39, 174, 96] as [number, number, number],
  red: [192, 57, 43] as [number, number, number],
}

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

// ── Section header helper ─────────────────────────────────────────────────────

function drawSectionHeader(doc: jsPDF, title: string, y: number, margin: number, pageW: number) {
  doc.setFillColor(...COLOR.teal)
  doc.rect(margin, y, 3.5, 6, 'F')
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR.textDark)
  doc.text(prepareArabicText(title), margin + 6, y + 4.5)

  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.line(margin, y + 7, pageW - margin, y + 7)
  return y + 10
}

// ── Core PDF renderer ─────────────────────────────────────────────────────────

export async function renderPdf(payload: PdfExportPayload): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  await registerArabicFont(doc)

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const ML = 12
  const MR = 12
  const contentW = W - ML - MR

  // ── Top header band (navy) ───────────────────────────────────────────────
  doc.setFillColor(...COLOR.navy)
  doc.rect(0, 0, W, 20, 'F')

  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setTextColor(...COLOR.white)

  doc.setFontSize(9)
  doc.text(payload.companyName, ML, 13)

  doc.setFontSize(15)
  doc.text(prepareArabicText(payload.reportTitle), W / 2, 13, { align: 'center' })

  doc.setFontSize(9)
  doc.text(prepareArabicText(payload.exportDate), W - MR, 13, { align: 'right' })

  // ── Subtitle band (teal) ─────────────────────────────────────────────────
  const filtersText = buildFiltersLabel(payload.activeFilters)
  doc.setFillColor(...COLOR.teal)
  doc.rect(0, 20, W, 7, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.white)
  doc.text(prepareArabicText(filtersText), W / 2, 25, { align: 'center' })

  let y = 32

  // ── KPI cards ────────────────────────────────────────────────────────────
  if (payload.kpis.length > 0) {
    const gap = 4
    const cardW = (contentW - gap * (payload.kpis.length - 1)) / payload.kpis.length
    const cardH = 22

    payload.kpis.forEach((kpi, i) => {
      const x = ML + i * (cardW + gap)

      // Shadow
      doc.setFillColor(...COLOR.shadow)
      doc.roundedRect(x + 0.5, y + 0.5, cardW, cardH, 2, 2, 'F')

      // Card background
      doc.setFillColor(...COLOR.kpiBg)
      doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F')

      // Top accent bar (color based on content type)
      const isNegative = kpi.value.toString().includes('-')
      const isPositive = !isNegative && kpi.value !== '0' && kpi.value !== ar('م.ج ٠')
      const barColor = isNegative
        ? COLOR.red
        : isPositive && kpi.label.includes('إيراد')
          ? COLOR.green
          : COLOR.navy
      doc.setFillColor(...barColor)
      doc.roundedRect(x, y, cardW, 3, 1, 1, 'F')
      doc.rect(x, y + 1.5, cardW, 1.5, 'F')

      // Label
      doc.setFont(ARABIC_FONT_NAME, 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...COLOR.textMid)
      doc.text(prepareArabicText(kpi.label), x + cardW / 2, y + 10, { align: 'center' })

      // Value
      doc.setFontSize(11)
      doc.setTextColor(...barColor)
      doc.text(prepareArabicText(kpi.value), x + cardW / 2, y + 18, { align: 'center' })
    })

    y += cardH + 7
  }

  // ── Tables ───────────────────────────────────────────────────────────────
  for (const table of payload.tables) {
    if (y > H - 35) {
      doc.addPage()
      y = 14
    }

    y = drawSectionHeader(doc, table.title, y, ML, W)

    const preparedHeaders = prepareTableHeaders(table.headers)
    const preparedRows = table.rows.map(prepareTableRow)

    autoTable(doc, {
      startY: y,
      head: [preparedHeaders],
      body: preparedRows,
      styles: {
        font: ARABIC_FONT_NAME,
        fontStyle: 'normal',
        fontSize: 8.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
        halign: 'right',
        textColor: COLOR.textDark,
        lineColor: COLOR.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: COLOR.navy,
        textColor: COLOR.white,
        font: ARABIC_FONT_NAME,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'right',
        cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      },
      alternateRowStyles: { fillColor: COLOR.rowAlt },
      margin: { left: ML, right: MR },
      tableWidth: contentW,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y
    y += 8
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.line(ML, H - 9, W - MR, H - 9)
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLOR.textLight)
  doc.text(`${payload.companyName} — Confidential`, ML, H - 5)
  doc.text(prepareArabicText('١ / ١ صفحة'), W - MR, H - 5, { align: 'right' })

  return doc
}

function ar(text: string): string {
  return text
}

// ── Download trigger ──────────────────────────────────────────────────────────

export async function downloadPdf(payload: PdfExportPayload, filename: string): Promise<void> {
  const doc = await renderPdf(payload)
  doc.save(filename)
}

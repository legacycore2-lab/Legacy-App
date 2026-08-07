/**
 * Unified PDF layout for every Legacy Fine Touch report.
 *
 * The template is intentionally simple and shared by all reports:
 * header -> filters/info -> table(s) -> summary -> footer.
 * Report-specific code only supplies title, filters, columns, rows and totals.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ARABIC_FONT_NAME, registerArabicFont } from './pdf-font.service'
import {
  prepareArabicText,
  prepareTableHeaders,
  prepareTableRow,
} from './arabic-text.service'
import { BRAND, COMPANY_NAME } from '../config/pdf-brand.config'
import { formatPdfDate } from './pdf-formatters'

export { COMPANY_NAME }

export type TemplateKpi = {
  label: string
  value: string
  highlight?: boolean
  hero?: boolean
}

export type TemplateInfoItem = {
  label: string
  value: string
}

export type TemplateTable = {
  title: string
  headers: string[]
  rows: (string | number)[][]
  paymentMethodCol?: number
  balanceCol?: number
  paymentMethods?: string[]
}

export type TemplateTotalBar = {
  label: string
  value: string
  note: string
}

export type TemplateNotes = {
  text: string
}

export type TemplateSignature = {
  title: string
}

export type PdfTemplateInput = {
  orientation?: 'portrait' | 'landscape'
  reportTitle: string
  reportSubtitle?: string
  infoItems?: TemplateInfoItem[]
  kpis?: TemplateKpi[]
  tables: TemplateTable[]
  totalBar?: TemplateTotalBar
  notes?: TemplateNotes
  signatures?: TemplateSignature[]
}

type RGB = [number, number, number]

function ar(text: string | number): string {
  return prepareArabicText(String(text))
}

const todayAr = (): string => formatPdfDate()

function paymentBadgeColors(method: string): { bg: RGB; fg: RGB } {
  const value = method.trim()
  if (
    value.includes('شيك') ||
    value.toLowerCase().includes('cheque') ||
    value.toLowerCase().includes('check')
  ) {
    return BRAND.badge.cheque
  }
  if (
    value.includes('تحويل') ||
    value.toLowerCase().includes('bank') ||
    value.includes('بنك')
  ) {
    return BRAND.badge.bank
  }
  return BRAND.badge.cash
}

function drawHeader(
  doc: jsPDF,
  W: number,
  ML: number,
  reportTitle: string,
  subtitle: string,
): number {
  doc.setFont(ARABIC_FONT_NAME, 'normal')

  doc.setFontSize(15)
  doc.setTextColor(...BRAND.dark)
  doc.text(ar(COMPANY_NAME), ML, 15)

  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.textMid)
  doc.text(ar('للمقاولات والتشطيبات'), ML, 21)

  doc.setFontSize(19)
  doc.setTextColor(...BRAND.textDark)
  doc.text(ar(reportTitle), W / 2, 16, { align: 'center' })

  doc.setFontSize(7)
  doc.setTextColor(...BRAND.textMid)
  doc.text(ar(`تاريخ التقرير: ${todayAr()}`), W - ML, 13, { align: 'right' })
  if (subtitle) {
    doc.text(ar(subtitle), W - ML, 20, { align: 'right', maxWidth: 72 })
  }

  doc.setDrawColor(...BRAND.dark)
  doc.setLineWidth(0.55)
  doc.line(ML, 27, W - ML, 27)

  return 32
}

function drawInfoBar(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  items: TemplateInfoItem[],
): number {
  if (items.length === 0) return y

  const contentW = W - ML * 2
  const barH = 17
  const cellW = contentW / items.length

  doc.setDrawColor(...BRAND.border)
  doc.setLineWidth(0.25)
  doc.roundedRect(ML, y, contentW, barH, 1.5, 1.5, 'S')

  items.forEach((item, index) => {
    const x = ML + contentW - (index + 1) * cellW
    if (index < items.length - 1) doc.line(x, y + 2, x, y + barH - 2)

    const cx = x + cellW / 2
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(item.label), cx, y + 6, { align: 'center' })
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.textDark)
    doc.text(ar(item.value), cx, y + 13, {
      align: 'center',
      maxWidth: cellW - 4,
    })
  })

  return y + barH + 5
}

function drawDefaultInfoBar(doc: jsPDF, W: number, ML: number, y: number): number {
  return drawInfoBar(doc, W, ML, y, [
    { label: 'تاريخ التقرير', value: todayAr() },
  ])
}

function drawKpiCards(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  kpis: TemplateKpi[],
): number {
  if (kpis.length === 0) return y

  const contentW = W - ML * 2
  const gap = 2
  const count = kpis.length
  const cardW = (contentW - gap * (count - 1)) / count
  const cardH = 20

  kpis.forEach((kpi, index) => {
    const x = ML + contentW - (index + 1) * cardW - index * gap
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.25)
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'S')

    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(kpi.label), x + cardW / 2, y + 7, { align: 'center' })

    doc.setFontSize(11)
    doc.setTextColor(...(kpi.highlight ? BRAND.gold : BRAND.dark))
    doc.text(ar(kpi.value), x + cardW / 2, y + 15, { align: 'center' })
  })

  return y + cardH + 5
}

function drawSectionTitle(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  title: string,
): number {
  if (!title) return y
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.dark)
  doc.text(ar(title), W - ML, y + 4, { align: 'right' })
  return y + 7
}

function drawTable(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  table: TemplateTable,
): number {
  const preparedHeaders = prepareTableHeaders(table.headers)
  const preparedRows = table.rows.map(prepareTableRow)
  const columnStyles: Record<number, object> = {}

  if (table.balanceCol !== undefined) {
    columnStyles[table.balanceCol] = {
      textColor: BRAND.blue,
      fontStyle: 'bold',
    }
  }

  autoTable(doc, {
    startY: y,
    head: [preparedHeaders],
    body: preparedRows,
    styles: {
      font: ARABIC_FONT_NAME,
      fontStyle: 'normal',
      fontSize: 7.5,
      cellPadding: { top: 2.6, bottom: 2.6, left: 2.5, right: 2.5 },
      halign: 'right',
      valign: 'middle',
      textColor: BRAND.textDark,
      lineColor: BRAND.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: BRAND.dark,
      textColor: BRAND.white,
      font: ARABIC_FONT_NAME,
      fontSize: 7.5,
      halign: 'right',
      cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
    },
    alternateRowStyles: { fillColor: BRAND.offWhite },
    columnStyles,
    margin: { left: ML, right: ML, top: 12, bottom: 18 },
    tableWidth: W - ML * 2,
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    didDrawCell: (data) => {
      if (
        data.section !== 'body' ||
        table.paymentMethodCol === undefined ||
        data.column.index !== table.paymentMethodCol ||
        !table.paymentMethods
      ) {
        return
      }

      const method = table.paymentMethods[data.row.index]
      if (!method) return
      const { bg, fg } = paymentBadgeColors(method)
      const { x, y: cellY, width, height } = data.cell
      doc.setFillColor(...bg)
      doc.roundedRect(x + 1, cellY + 1, width - 2, height - 2, 1, 1, 'F')
      doc.setTextColor(...fg)
      doc.setFont(ARABIC_FONT_NAME, 'normal')
      doc.setFontSize(7)
      doc.text(ar(method), x + width / 2, cellY + height / 2 + 1, {
        align: 'center',
      })
    },
  })

  return (
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      ?.finalY ?? y
  )
}

function drawTotalBar(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  bar: TemplateTotalBar,
): number {
  const contentW = W - ML * 2
  const height = 18

  doc.setDrawColor(...BRAND.border)
  doc.roundedRect(ML, y, contentW, height, 1.5, 1.5, 'S')

  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...BRAND.textMid)
  doc.text(ar(bar.label), W - ML - 4, y + 6, { align: 'right' })

  doc.setFontSize(11)
  doc.setTextColor(...BRAND.dark)
  doc.text(ar(bar.value), W - ML - 4, y + 14, { align: 'right' })

  if (bar.note) {
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(bar.note), ML + 4, y + 11, { maxWidth: contentW * 0.55 })
  }

  return y + height + 5
}

function drawNotes(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  notes: TemplateNotes,
): number {
  const contentW = W - ML * 2
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.textMid)
  doc.text(ar(`ملاحظات: ${notes.text}`), W - ML, y + 5, {
    align: 'right',
    maxWidth: contentW,
  })
  return y + 10
}

function drawSignatures(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  signatures: TemplateSignature[],
): number {
  const contentW = W - ML * 2
  const colW = contentW / signatures.length

  signatures.forEach((signature, index) => {
    const cx = ML + contentW - (index + 0.5) * colW
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(signature.title), cx, y, { align: 'center' })
    doc.setDrawColor(...BRAND.border)
    doc.line(cx - 15, y + 9, cx + 15, y + 9)
  })

  return y + 14
}

function stampPageFooters(doc: jsPDF, W: number, H: number, ML: number): void {
  const totalPages =
    (doc as jsPDF & { internal: { pages: unknown[] } }).internal.pages.length - 1

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)
    const y = H - 11

    doc.setDrawColor(...BRAND.dark)
    doc.setLineWidth(0.35)
    doc.line(ML, y - 4, W - ML, y - 4)

    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(`تاريخ الطباعة: ${todayAr()}`), ML, y)
    doc.text(ar(COMPANY_NAME), W / 2, y, { align: 'center' })
    doc.text(ar(`صفحة ${page} من ${totalPages}`), W - ML, y, {
      align: 'right',
    })
  }
}

export async function renderPdfTemplate(input: PdfTemplateInput): Promise<jsPDF> {
  const orientation = input.orientation ?? 'portrait'
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  await registerArabicFont(doc)

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const ML = 10

  let y = drawHeader(doc, W, ML, input.reportTitle, input.reportSubtitle ?? '')

  if (input.infoItems && input.infoItems.length > 0) {
    y = drawInfoBar(doc, W, ML, y, input.infoItems)
  } else {
    y = drawDefaultInfoBar(doc, W, ML, y)
  }

  for (const table of input.tables) {
    if (y > H - 38) {
      doc.addPage()
      y = 12
    }
    y = drawSectionTitle(
      doc,
      W,
      ML,
      y,
      input.tables.length > 1 ? table.title : '',
    )
    y = drawTable(doc, W, ML, y, table)
    y += 5
  }

  if (input.kpis && input.kpis.length > 0) {
    if (y > H - 38) {
      doc.addPage()
      y = 12
    }
    y = drawKpiCards(doc, W, ML, y, input.kpis)
  }

  if (input.totalBar) {
    if (y > H - 32) {
      doc.addPage()
      y = 12
    }
    y = drawTotalBar(doc, W, ML, y, input.totalBar)
  }

  if (input.notes) {
    if (y > H - 24) {
      doc.addPage()
      y = 12
    }
    y = drawNotes(doc, W, ML, y, input.notes)
  }

  if (input.signatures && input.signatures.length > 0) {
    if (y > H - 28) {
      doc.addPage()
      y = 12
    }
    drawSignatures(doc, W, ML, y, input.signatures)
  }

  stampPageFooters(doc, W, H, ML)
  return doc
}

export async function downloadPdfTemplate(
  input: PdfTemplateInput,
  filename: string,
): Promise<void> {
  const doc = await renderPdfTemplate(input)
  doc.save(filename)
}

export {
  drawHeader,
  drawInfoBar,
  drawKpiCards,
  drawSectionTitle,
  stampPageFooters,
}

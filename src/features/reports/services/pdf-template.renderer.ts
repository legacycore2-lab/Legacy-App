/**
 * pdf-template.renderer.ts
 *
 * Unified PDF layout engine for Legacy Fine Touch ERP.
 * Every report passes through this template — no duplicated header/footer logic.
 *
 * Layout sections (in order):
 *   drawCornerTriangle → drawHeader → drawInfoBar → drawKpiCards
 *   → drawSectionTitle → drawTable (repeatable) → drawTotalBar
 *   → drawNotes → drawSignatures → drawPageFooters
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ARABIC_FONT_NAME, registerArabicFont } from './pdf-font.service'
import { prepareArabicText, prepareTableHeaders, prepareTableRow } from './arabic-text.service'
import { BRAND, COMPANY_NAME, COMPANY_LOCATION, COMPANY_WEBSITE } from '../config/pdf-brand.config'
import { formatPdfDate } from './pdf-formatters'

// ── Re-exports so callers need only one import ────────────────────────────────
export { COMPANY_NAME }

// ── Types ─────────────────────────────────────────────────────────────────────

export type TemplateKpi = {
  label: string
  value: string
  /** When true the value renders in gold accent colour */
  highlight?: boolean
  /** First card is rendered as large hero card */
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
  /** Column index whose cell gets a coloured payment-method badge */
  paymentMethodCol?: number
  /** Column index to render in blue bold (running balance) */
  balanceCol?: number
  /** Raw payment method strings parallel to rows, used for badge colouring */
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
  /** Portrait A4 (default) or landscape */
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

// ── Internal helpers ──────────────────────────────────────────────────────────

type RGB = [number, number, number]

function ar(text: string | number): string {
  return prepareArabicText(String(text))
}

/** Returns full Arabic date string — e.g. "٦ أغسطس ٢٠٢٦" — delegates to pdf-formatters */
const todayAr = (): string => formatPdfDate()

function paymentBadgeColors(method: string): { bg: RGB; fg: RGB } {
  const m = method.trim()
  if (m.includes('شيك') || m.toLowerCase().includes('cheque') || m.toLowerCase().includes('check'))
    return BRAND.badge.cheque
  if (m.includes('تحويل') || m.toLowerCase().includes('bank') || m.includes('بنك')) return BRAND.badge.bank
  return BRAND.badge.cash
}

// ── Section: corner triangle ──────────────────────────────────────────────────

function drawCornerTriangle(doc: jsPDF, W: number): void {
  doc.setFillColor(...BRAND.dark)
  doc.triangle(W - 30, 0, W, 0, W, 30, 'F')
}

// ── Section: header ───────────────────────────────────────────────────────────

function drawHeader(doc: jsPDF, W: number, ML: number, reportTitle: string, subtitle: string): number {
  drawCornerTriangle(doc, W)

  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(20)
  doc.setTextColor(...BRAND.dark)
  doc.text(ar(COMPANY_NAME), ML, 18)

  doc.setFontSize(8)
  doc.setTextColor(...BRAND.textMid)
  doc.text(ar('إنشاء وتشطيبات'), ML, 24)

  doc.setDrawColor(...BRAND.border)
  doc.setLineWidth(0.4)
  doc.line(W / 2 - 10, 6, W / 2 - 10, 28)

  doc.setFontSize(22)
  doc.setTextColor(...BRAND.dark)
  doc.text(ar(reportTitle), W - ML, 16, { align: 'right' })

  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(...BRAND.light)
    doc.text(ar(subtitle), W - ML, 24, { align: 'right' })
  }

  doc.setDrawColor(...BRAND.border)
  doc.setLineWidth(0.5)
  doc.line(ML, 30, W - ML, 30)

  return 34
}

// ── Section: info bar ─────────────────────────────────────────────────────────

function drawInfoBar(doc: jsPDF, W: number, ML: number, y: number, items: TemplateInfoItem[]): number {
  const barH = 22
  const contentW = W - ML * 2
  const cols = items.length || 1
  const cellW = contentW / cols

  doc.setDrawColor(...BRAND.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(ML, y, contentW, barH, 2, 2, 'S')

  items.forEach((item, i) => {
    const x = ML + contentW - (i + 1) * cellW
    if (i < items.length - 1) {
      doc.setDrawColor(...BRAND.border)
      doc.line(x, y + 2, x, y + barH - 2)
    }
    const cx = x + cellW / 2
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(item.label), cx, y + 7, { align: 'center' })
    doc.setFontSize(9.5)
    doc.setTextColor(...BRAND.textDark)
    doc.text(ar(item.value), cx, y + 16, { align: 'center' })
  })

  return y + barH + 5
}

// ── Section: default info bar (date/time only) ────────────────────────────────

function drawDefaultInfoBar(doc: jsPDF, W: number, ML: number, y: number): number {
  return drawInfoBar(doc, W, ML, y, [{ label: 'تاريخ التقرير', value: todayAr() }])
}

// ── Section: KPI cards ────────────────────────────────────────────────────────

function drawKpiCards(doc: jsPDF, W: number, ML: number, y: number, kpis: TemplateKpi[]): number {
  if (kpis.length === 0) return y

  const contentW = W - ML * 2
  const kpiH = 28
  const gap = 4
  const hero = kpis[0]

  if (kpis.length === 1) {
    // Single card — no hero treatment
    doc.setFillColor(...BRAND.offWhite)
    doc.setDrawColor(...BRAND.border)
    doc.roundedRect(ML, y, contentW, kpiH, 2, 2, 'FD')
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(kpis[0].label), W / 2, y + 8, { align: 'center' })
    doc.setFontSize(14)
    doc.setTextColor(...BRAND.dark)
    doc.text(ar(kpis[0].value), W / 2, y + 20, { align: 'center' })
    return y + kpiH + 6
  }

  // Hero card (first KPI)
  const heroW = 42
  doc.setFillColor(...BRAND.dark)
  doc.roundedRect(ML, y, heroW, kpiH, 2, 2, 'F')
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...BRAND.white)
  doc.text(ar(hero?.label ?? ''), ML + heroW / 2, y + 7, { align: 'center' })
  doc.setFontSize(13)
  doc.text(ar(hero?.value ?? ''), ML + heroW / 2, y + 18, { align: 'center' })

  // Rest of KPIs
  const rest = kpis.slice(1)
  const restW = contentW - heroW - gap
  const cardW = (restW - gap * (rest.length - 1)) / Math.max(rest.length, 1)

  rest.forEach((kpi, i) => {
    const x = ML + heroW + gap + i * (cardW + gap)
    doc.setFillColor(...BRAND.offWhite)
    doc.setDrawColor(...BRAND.border)
    doc.roundedRect(x, y, cardW, kpiH, 2, 2, 'FD')
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(kpi.label), x + cardW / 2, y + 7, { align: 'center' })
    doc.setFontSize(kpi.highlight ? 11 : 12)
    doc.setTextColor(...(kpi.highlight ? BRAND.gold : BRAND.textDark))
    doc.text(ar(kpi.value), x + cardW / 2, y + 17, { align: 'center' })
  })

  return y + kpiH + 6
}

// ── Section: section title ────────────────────────────────────────────────────

function drawSectionTitle(doc: jsPDF, W: number, ML: number, y: number, title: string): number {
  doc.setDrawColor(...BRAND.border)
  doc.setFillColor(...BRAND.offWhite)
  doc.roundedRect(ML, y, W - ML * 2, 8, 1, 1, 'FD')
  doc.setFillColor(...BRAND.light)
  doc.circle(ML + 8, y + 4, 1.5, 'F')
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.dark)
  doc.text(ar(title), W / 2, y + 5.5, { align: 'center' })
  return y + 11
}

// ── Section: data table ───────────────────────────────────────────────────────

function drawTable(doc: jsPDF, W: number, ML: number, y: number, table: TemplateTable): number {
  const preparedHeaders = prepareTableHeaders(table.headers)
  const preparedRows = table.rows.map(prepareTableRow)

  const columnStyles: Record<number, object> = {}
  if (table.balanceCol !== undefined) {
    columnStyles[table.balanceCol] = { textColor: BRAND.blue, fontStyle: 'bold' }
  }

  autoTable(doc, {
    startY: y,
    head: [preparedHeaders],
    body: preparedRows,
    styles: {
      font: ARABIC_FONT_NAME,
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      halign: 'right',
      textColor: BRAND.textDark,
      lineColor: BRAND.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: BRAND.dark,
      textColor: BRAND.white,
      font: ARABIC_FONT_NAME,
      fontSize: 8,
      halign: 'right',
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: BRAND.offWhite },
    columnStyles,
    margin: { left: ML, right: ML },
    tableWidth: W - ML * 2,
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    didDrawCell: (data) => {
      if (
        data.section === 'body' &&
        table.paymentMethodCol !== undefined &&
        data.column.index === table.paymentMethodCol &&
        table.paymentMethods
      ) {
        const method = table.paymentMethods[data.row.index]
        if (!method) return
        const { bg, fg } = paymentBadgeColors(method)
        const { x, y: cy, width, height } = data.cell
        doc.setFillColor(...bg)
        doc.roundedRect(x + 1.5, cy + 1.5, width - 3, height - 3, 1.5, 1.5, 'F')
        doc.setTextColor(...fg)
        doc.setFont(ARABIC_FONT_NAME, 'normal')
        doc.setFontSize(7.5)
        doc.text(ar(method), x + width / 2, cy + height / 2 + 1, { align: 'center' })
      }
    },
  })

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y
}

// ── Section: total bar ────────────────────────────────────────────────────────

function drawTotalBar(doc: jsPDF, W: number, ML: number, y: number, bar: TemplateTotalBar): number {
  const barH = 18
  const contentW = W - ML * 2
  const leftW = 55

  doc.setFillColor(...BRAND.dark)
  doc.roundedRect(ML, y, leftW, barH, 2, 2, 'F')
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...BRAND.white)
  doc.text(ar(bar.label), ML + leftW / 2, y + 6, { align: 'center' })
  doc.setFontSize(13)
  doc.text(ar(bar.value), ML + leftW / 2, y + 14, { align: 'center' })

  const noteX = ML + leftW + 4
  const noteW = contentW - leftW - 4
  doc.setDrawColor(...BRAND.border)
  doc.setFillColor(...BRAND.offWhite)
  doc.roundedRect(noteX, y, noteW, barH, 2, 2, 'FD')
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.textMid)
  doc.text(ar(bar.note), noteX + noteW - 4, y + barH / 2 + 1, {
    align: 'right',
    maxWidth: noteW - 8,
  })

  return y + barH + 5
}

// ── Section: notes ────────────────────────────────────────────────────────────

function drawNotes(doc: jsPDF, W: number, ML: number, y: number, notes: TemplateNotes): number {
  const contentW = W - ML * 2
  doc.setDrawColor(...BRAND.border)
  doc.setFillColor(...BRAND.offWhite)
  doc.roundedRect(ML, y, contentW, 16, 2, 2, 'FD')
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...BRAND.dark)
  doc.text(ar('ملاحظات'), W - ML - 4, y + 6, { align: 'right' })
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.textMid)
  doc.text(ar(notes.text), W - ML - 4, y + 12, { align: 'right', maxWidth: contentW - 8 })
  return y + 20
}

// ── Section: signatures ───────────────────────────────────────────────────────

function drawSignatures(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  signatures: TemplateSignature[],
): number {
  const contentW = W - ML * 2
  const count = signatures.length
  const colW = contentW / count
  const today = todayAr()

  signatures.forEach((sig, i) => {
    const cx = ML + (count - 1 - i) * colW + colW / 2
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.dark)
    doc.text(ar(sig.title), cx, y, { align: 'center' })
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.5)
    doc.line(cx - 18, y + 12, cx + 18, y + 12)
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.textMid)
    doc.text(ar(today), cx, y + 17, { align: 'center' })
  })

  return y + 22
}

// ── Section: page footer (stamped on every page) ──────────────────────────────

function stampPageFooters(doc: jsPDF, W: number, H: number, ML: number): void {
  const totalPages = (doc as jsPDF & { internal: { pages: unknown[] } }).internal.pages.length - 1

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const footerY = H - 16

    doc.setFillColor(...BRAND.dark)
    doc.rect(0, footerY, W, 16, 'F')

    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.white)
    doc.text(ar(`${COMPANY_NAME} — Confidential`), ML, footerY + 6)
    doc.text(ar(`صفحة ${p} / ${totalPages}`), W - ML, footerY + 6, { align: 'right' })

    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.footerText)
    doc.text(ar(COMPANY_WEBSITE), ML, footerY + 12)
    doc.text(ar(COMPANY_LOCATION), W - ML, footerY + 12, { align: 'right' })
  }
}

// ── Public: render ────────────────────────────────────────────────────────────

export async function renderPdfTemplate(input: PdfTemplateInput): Promise<jsPDF> {
  const orientation = input.orientation ?? 'portrait'
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  await registerArabicFont(doc)

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const ML = 12

  let y = drawHeader(doc, W, ML, input.reportTitle, input.reportSubtitle ?? '')

  if (input.infoItems && input.infoItems.length > 0) {
    y = drawInfoBar(doc, W, ML, y, input.infoItems)
  } else {
    y = drawDefaultInfoBar(doc, W, ML, y)
  }

  if (input.kpis && input.kpis.length > 0) {
    y = drawKpiCards(doc, W, ML, y, input.kpis)
  }

  for (const table of input.tables) {
    if (y > H - 40) {
      doc.addPage()
      y = 14
    }
    y = drawSectionTitle(doc, W, ML, y, table.title)
    y = drawTable(doc, W, ML, y, table)
    y += 6
  }

  if (input.totalBar) {
    if (y > H - 30) {
      doc.addPage()
      y = 14
    }
    y = drawTotalBar(doc, W, ML, y, input.totalBar)
  }

  if (input.notes) {
    if (y > H - 25) {
      doc.addPage()
      y = 14
    }
    y = drawNotes(doc, W, ML, y, input.notes)
  }

  if (input.signatures && input.signatures.length > 0) {
    if (y > H - 35) {
      doc.addPage()
      y = 14
    }
    drawSignatures(doc, W, ML, y, input.signatures)
  }

  stampPageFooters(doc, W, H, ML)

  return doc
}

export async function downloadPdfTemplate(input: PdfTemplateInput, filename: string): Promise<void> {
  const doc = await renderPdfTemplate(input)
  doc.save(filename)
}

// ── Re-export section helpers for tests ──────────────────────────────────────
export { drawHeader, drawInfoBar, drawKpiCards, drawSectionTitle, stampPageFooters }

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ARABIC_FONT_NAME, registerArabicFont } from './pdf-font.service'
import { prepareArabicText, prepareTableHeaders, prepareTableRow } from './arabic-text.service'
import type { ContractorStatementViewModel } from '../types/contractor-statement.types'
import type { ContractorReportsFilters } from '../types/contractor-reports.types'
import { formatMoneyInteger } from '../../../shared/formatters'

// ── Brand colours ──────────────────────────────────────────────────────────────
const G = {
  dark: [18, 61, 43] as [number, number, number], // #123D2B
  mid: [27, 94, 64] as [number, number, number], // #1B5E40
  light: [39, 174, 96] as [number, number, number], // accent green
  gold: [230, 160, 30] as [number, number, number], // amber KPI
  blue: [30, 100, 200] as [number, number, number], // running balance
  white: [255, 255, 255] as [number, number, number],
  offWhite: [245, 248, 245] as [number, number, number],
  border: [210, 225, 215] as [number, number, number],
  textDark: [20, 40, 30] as [number, number, number],
  textMid: [80, 110, 95] as [number, number, number],
  textLight: [150, 170, 160] as [number, number, number],
  red: [192, 57, 43] as [number, number, number],
  badgeCash: [39, 174, 96] as [number, number, number],
  badgeCashBg: [220, 245, 230] as [number, number, number],
  badgeChq: [200, 130, 30] as [number, number, number],
  badgeChqBg: [255, 240, 210] as [number, number, number],
  badgeBank: [30, 100, 200] as [number, number, number],
  badgeBankBg: [220, 235, 255] as [number, number, number],
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ar(text: string): string {
  return prepareArabicText(String(text))
}

function todayDateAr(): string {
  return new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function todayTimeAr(): string {
  return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

// ── Triangle corner decoration ─────────────────────────────────────────────────

function drawCornerTriangle(doc: jsPDF, W: number): void {
  doc.setFillColor(...G.dark)
  doc.triangle(W - 30, 0, W, 0, W, 30, 'F')
}

// ── Header band ────────────────────────────────────────────────────────────────

function drawHeader(doc: jsPDF, W: number, companyName: string, reportTitle: string, subtitle: string): void {
  const ML = 12

  // White background — page default

  // Company name (left, Arabic)
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(20)
  doc.setTextColor(...G.dark)
  doc.text(ar(companyName), ML, 18)

  doc.setFontSize(8)
  doc.setTextColor(...G.textMid)
  doc.text(ar('إنشاء وتشطيبات'), ML, 24)

  // Vertical divider
  doc.setDrawColor(...G.border)
  doc.setLineWidth(0.4)
  doc.line(W / 2 - 10, 6, W / 2 - 10, 28)

  // Report title (right side)
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(22)
  doc.setTextColor(...G.dark)
  doc.text(ar(reportTitle), W - ML, 16, { align: 'right' })

  doc.setFontSize(10)
  doc.setTextColor(...G.light)
  doc.text(ar(subtitle), W - ML, 24, { align: 'right' })

  // Bottom border
  doc.setDrawColor(...G.border)
  doc.setLineWidth(0.5)
  doc.line(ML, 30, W - ML, 30)
}

// ── Info bar (contractor / project / period / date) ────────────────────────────

function drawInfoBar(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  contractorName: string,
  projectName: string,
  dateFrom: string,
  dateTo: string,
): number {
  const barH = 22
  const contentW = W - ML * 2
  const cellW = contentW / 4
  const border = G.border

  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.roundedRect(ML, y, contentW, barH, 2, 2, 'S')

  const items = [
    { label: 'المقاول', value: contractorName },
    { label: 'المشروع', value: projectName },
    { label: 'الفترة', value: dateFrom ? `${dateFrom} إلى ${dateTo}` : '—' },
    { label: 'تاريخ التقرير', value: `${todayDateAr()} ${todayTimeAr()}` },
  ]

  items.forEach((item, i) => {
    const x = ML + contentW - (i + 1) * cellW
    // Divider
    if (i < 3) {
      doc.setDrawColor(...border)
      doc.line(x, y + 2, x, y + barH - 2)
    }
    const cx = x + cellW / 2
    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...G.textMid)
    doc.text(ar(item.label), cx, y + 7, { align: 'center' })
    doc.setFontSize(9.5)
    doc.setTextColor(...G.textDark)
    doc.text(ar(item.value), cx, y + 16, { align: 'center' })
  })

  return y + barH + 5
}

// ── KPI row ─────────────────────────────────────────────────────────────────────

function drawKpis(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  summary: ContractorStatementViewModel['summary'],
): number {
  const contentW = W - ML * 2
  const kpiH = 28
  const gap = 4

  // First KPI — large green card
  const heroW = 42
  doc.setFillColor(...G.dark)
  doc.roundedRect(ML, y, heroW, kpiH, 2, 2, 'F')
  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...G.white)
  doc.text(ar('إجمالي المدفوعات'), ML + heroW / 2, y + 7, { align: 'center' })
  doc.setFontSize(13)
  doc.text(formatMoneyInteger(summary.totalPayments), ML + heroW / 2, y + 18, { align: 'center' })
  doc.setFontSize(7)
  doc.text(ar('ج.م'), ML + heroW / 2, y + 25, { align: 'center' })

  // Remaining KPIs
  const restKpis = [
    { label: 'عدد الدفعات', value: String(summary.paymentCount), sub: 'دفعة' },
    { label: 'عدد المشاريع', value: String(summary.projectCount), sub: 'مشروع' },
    { label: 'متوسط الدفعة', value: formatMoneyInteger(summary.averagePayment), sub: 'ج.م', gold: true },
    { label: 'أول دفعة', value: summary.firstPaymentDate ?? '—', sub: '' },
    { label: 'آخر دفعة', value: summary.lastPaymentDate ?? '—', sub: '' },
  ]

  const restW = contentW - heroW - gap
  const cardW = (restW - gap * (restKpis.length - 1)) / restKpis.length

  restKpis.forEach((kpi, i) => {
    const x = ML + heroW + gap + i * (cardW + gap)
    doc.setDrawColor(...G.border)
    doc.setFillColor(...G.offWhite)
    doc.roundedRect(x, y, cardW, kpiH, 2, 2, 'FD')

    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...G.textMid)
    doc.text(ar(kpi.label), x + cardW / 2, y + 7, { align: 'center' })

    doc.setFontSize(kpi.gold ? 11 : 12)
    doc.setTextColor(...(kpi.gold ? G.gold : G.textDark))
    doc.text(ar(kpi.value), x + cardW / 2, y + 17, { align: 'center' })

    if (kpi.sub) {
      doc.setFontSize(6)
      doc.setTextColor(...G.textLight)
      doc.text(ar(kpi.sub), x + cardW / 2, y + 24, { align: 'center' })
    }
  })

  return y + kpiH + 6
}

// ── Section title ───────────────────────────────────────────────────────────────

function drawSectionTitle(doc: jsPDF, W: number, ML: number, y: number, title: string): number {
  doc.setDrawColor(...G.border)
  doc.setFillColor(...G.offWhite)
  doc.roundedRect(ML, y, W - ML * 2, 8, 1, 1, 'FD')

  doc.setFillColor(...G.light)
  doc.circle(ML + 8, y + 4, 1.5, 'F')

  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...G.dark)
  doc.text(ar(title), W / 2, y + 5.5, { align: 'center' })

  return y + 11
}

// ── Payment method badge colour ─────────────────────────────────────────────────

function paymentMethodColors(method: string): {
  bg: [number, number, number]
  fg: [number, number, number]
} {
  const m = method.trim()
  if (m.includes('شيك') || m.includes('cheque') || m.includes('check'))
    return { bg: G.badgeChqBg, fg: G.badgeChq }
  if (m.includes('تحويل') || m.includes('bank') || m.includes('بنك'))
    return { bg: G.badgeBankBg, fg: G.badgeBank }
  return { bg: G.badgeCashBg, fg: G.badgeCash }
}

// ── Payments table ──────────────────────────────────────────────────────────────

function drawPaymentsTable(
  doc: jsPDF,
  W: number,
  ML: number,
  y: number,
  payments: ContractorStatementViewModel['payments'],
): number {
  const headers = [
    '#',
    'التاريخ',
    'رقم القيد',
    'المشروع',
    'البند',
    'البيان',
    'طريقة الدفع',
    'قيمة الدفعة',
    'الرصيد التراكمي',
  ]
  const preparedHeaders = prepareTableHeaders(headers)

  const rows = payments.map((p, i) =>
    prepareTableRow([
      i + 1,
      p.entryDate,
      p.entryNumber ?? '—',
      p.projectName,
      p.category,
      p.description,
      p.paymentMethod,
      formatMoneyInteger(p.amount),
      formatMoneyInteger(p.runningBalance),
    ]),
  )

  autoTable(doc, {
    startY: y,
    head: [preparedHeaders],
    body: rows,
    styles: {
      font: ARABIC_FONT_NAME,
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      halign: 'right',
      textColor: G.textDark,
      lineColor: G.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: G.dark,
      textColor: G.white,
      font: ARABIC_FONT_NAME,
      fontSize: 8,
      halign: 'right',
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: G.offWhite },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      8: { textColor: G.blue, fontStyle: 'bold' },
    },
    margin: { left: ML, right: ML },
    tableWidth: W - ML * 2,
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    didDrawCell: (data) => {
      // Payment method badge on column 6
      if (data.section === 'body' && data.column.index === 6) {
        const payment = payments[data.row.index]
        if (!payment) return
        const { bg, fg } = paymentMethodColors(payment.paymentMethod)
        const { x, y: cy, width, height } = data.cell
        const padH = 2.5
        const padV = 2
        const textW = width - padH * 2
        const textH = height - padV * 2
        doc.setFillColor(...bg)
        doc.roundedRect(x + padH - 1, cy + padV - 0.5, textW + 2, textH + 1, 1.5, 1.5, 'F')
        doc.setTextColor(...fg)
        doc.setFont(ARABIC_FONT_NAME, 'normal')
        doc.setFontSize(7.5)
        doc.text(ar(payment.paymentMethod), x + width / 2, cy + height / 2 + 1, { align: 'center' })
      }
    },
  })

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y
}

// ── Total footer bar ────────────────────────────────────────────────────────────

function drawTotalBar(doc: jsPDF, W: number, ML: number, y: number, total: number, note: string): number {
  const barH = 18
  const contentW = W - ML * 2
  const leftW = 55

  doc.setFillColor(...G.dark)
  doc.roundedRect(ML, y, leftW, barH, 2, 2, 'F')

  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...G.white)
  doc.text(ar('إجمالي المدفوعات'), ML + leftW / 2, y + 6, { align: 'center' })
  doc.setFontSize(13)
  doc.text(formatMoneyInteger(total), ML + leftW / 2, y + 14, { align: 'center' })

  // Note area
  const noteX = ML + leftW + 4
  const noteW = contentW - leftW - 4
  doc.setDrawColor(...G.border)
  doc.setFillColor(...G.offWhite)
  doc.roundedRect(noteX, y, noteW, barH, 2, 2, 'FD')
  doc.setFontSize(7.5)
  doc.setTextColor(...G.textMid)
  doc.text(ar(note), noteX + noteW - 4, y + barH / 2 + 1, { align: 'right', maxWidth: noteW - 8 })

  return y + barH + 5
}

// ── Notes section ───────────────────────────────────────────────────────────────

function drawNotes(doc: jsPDF, W: number, ML: number, y: number, text: string): number {
  const contentW = W - ML * 2
  doc.setDrawColor(...G.border)
  doc.setFillColor(...G.offWhite)
  doc.roundedRect(ML, y, contentW, 16, 2, 2, 'FD')

  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G.dark)
  doc.text(ar('ملاحظات'), W - ML - 4, y + 6, { align: 'right' })
  doc.setFontSize(7.5)
  doc.setTextColor(...G.textMid)
  doc.text(ar(text), W - ML - 4, y + 12, { align: 'right', maxWidth: contentW - 8 })

  return y + 20
}

// ── Signatures ──────────────────────────────────────────────────────────────────

function drawSignatures(doc: jsPDF, W: number, ML: number, y: number): number {
  const contentW = W - ML * 2
  const colW = contentW / 3
  const today = todayDateAr()

  const sigs = [
    { title: 'إعداد المحاسب', x: ML + contentW - colW },
    { title: 'مراجعة مدير المشروع', x: ML + colW },
    { title: 'اعتماد المدير المالي', x: ML },
  ]

  sigs.forEach((sig) => {
    const cx = sig.x + colW / 2

    doc.setFont(ARABIC_FONT_NAME, 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...G.dark)
    doc.text(ar(sig.title), cx, y, { align: 'center' })

    // Signature line
    doc.setDrawColor(...G.border)
    doc.setLineWidth(0.5)
    doc.line(cx - 18, y + 12, cx + 18, y + 12)

    doc.setFontSize(7)
    doc.setTextColor(...G.textMid)
    doc.text(ar(today), cx, y + 17, { align: 'center' })
  })

  return y + 22
}

// ── Bottom company info footer ──────────────────────────────────────────────────

function drawCompanyFooter(
  doc: jsPDF,
  W: number,
  H: number,
  ML: number,
  companyName: string,
  pageNum: number,
  totalPages: number,
): void {
  const footerY = H - 16

  doc.setFillColor(...G.dark)
  doc.rect(0, footerY, W, 16, 'F')

  doc.setFont(ARABIC_FONT_NAME, 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...G.white)
  doc.text(ar(`${companyName} — Confidential`), ML, footerY + 6)
  doc.text(ar(`صفحة ${pageNum} / ${totalPages}`), W - ML, footerY + 6, { align: 'right' })

  doc.setFontSize(6.5)
  doc.setTextColor(...([180, 210, 195] as [number, number, number]))
  doc.text(ar('www.legacycore.app'), ML, footerY + 12)
  doc.text(ar('القاهرة — مصر'), W - ML, footerY + 12, { align: 'right' })
}

// ── Main renderer ───────────────────────────────────────────────────────────────

export async function renderContractorStatementPdf(
  statement: ContractorStatementViewModel,
  filters: ContractorReportsFilters,
  projectOptions: { id: string; name: string }[],
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await registerArabicFont(doc)

  const W = doc.internal.pageSize.getWidth() // 210
  const H = doc.internal.pageSize.getHeight() // 297
  const ML = 12

  const { summary, payments } = statement
  const projectName = filters.projectId
    ? (projectOptions.find((p) => p.id === filters.projectId)?.name ?? filters.projectId)
    : '—'

  // ── Page 1 ────────────────────────────────────────────────────────────────

  drawCornerTriangle(doc, W)
  drawHeader(doc, W, 'Legacy Core ERP', 'كشف حساب المقاول', 'تقرير المدفوعات')

  let y = 34

  y = drawInfoBar(doc, W, ML, y, filters.contractorName || '—', projectName, filters.dateFrom, filters.dateTo)
  y = drawKpis(doc, W, ML, y, summary)
  y = drawSectionTitle(doc, W, ML, y, 'تفاصيل الدفعات')

  y = drawPaymentsTable(doc, W, ML, y, payments)
  y += 5

  const noteText = 'جميع المبالغ المذكورة أعلاه تمثل كافة المدفوعات الفعلية للمقاول خلال الفترة المحددة.'

  // Check page space
  if (y > H - 85) {
    doc.addPage()
    y = 14
  }

  y = drawTotalBar(doc, W, ML, y, summary.totalPayments, noteText)
  y = drawNotes(doc, W, ML, y, noteText)

  if (y > H - 50) {
    doc.addPage()
    y = 14
  }

  drawSignatures(doc, W, ML, y)

  // ── Footer on every page ──────────────────────────────────────────────────
  const totalPages = (doc as jsPDF & { internal: { pages: unknown[] } }).internal.pages.length - 1
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawCompanyFooter(doc, W, H, ML, 'Legacy Core ERP', p, totalPages)
  }

  return doc
}

export async function downloadContractorStatementPdf(
  statement: ContractorStatementViewModel,
  filters: ContractorReportsFilters,
  projectOptions: { id: string; name: string }[],
  filename: string,
): Promise<void> {
  const doc = await renderContractorStatementPdf(statement, filters, projectOptions)
  doc.save(filename)
}

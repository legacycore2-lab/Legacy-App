import { formatAccountingDate } from '../../../shared/date-utils'
import type { ProjectDetailsViewModel, ProjectJournalViewModel } from '../types/project.types'

type ExportInput = {
  viewModel: ProjectDetailsViewModel
  journalViewModel: ProjectJournalViewModel | null | undefined
}

type ExportCell = string | number

type ExportRow = {
  number: ExportCell
  date: string
  type: string
  description: string
  amount: number
}

function buildRows({ journalViewModel }: ExportInput): ExportRow[] {
  const entries = journalViewModel?.entries ?? []
  return entries.map((entry) => ({
    number: entry.seq ?? '—',
    date: formatAccountingDate(entry.entryDate),
    type: entry.type === 'income' ? 'إيراد' : entry.type === 'expense' ? 'مصروف' : 'غير معروف',
    description: entry.description || 'بدون بيان',
    amount: entry.amount,
  }))
}

function safeFilename(projectName: string) {
  return (
    projectName
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-') || 'project'
  )
}

function filename(projectName: string, extension: 'xlsx' | 'doc') {
  return `project-report-${safeFilename(projectName)}.${extension}`
}

function escapeHtml(value: ExportCell) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportProjectReportExcel(input: ExportInput) {
  const { project, summary, remaining, progress, profitMargin } = input.viewModel
  const rows = buildRows(input)
  if (rows.length === 0) throw new Error('لا توجد قيود متاحة للتصدير.')

  const XLSX = await import('xlsx')
  const sheetRows: ExportCell[][] = [
    ['تقرير المشروع', project.name],
    ['كود المشروع', project.code || '—'],
    ['العميل', project.client || '—'],
    ['المدير', project.manager || '—'],
    ['بداية المشروع', formatAccountingDate(project.startDate)],
    ['نهاية المشروع', formatAccountingDate(project.endDate)],
    [],
    ['قيمة العقد', project.contractValue],
    ['إجمالي الإيرادات', summary.totalIncome],
    ['إجمالي المصروفات', summary.totalExpense],
    ['صافي الحركة', summary.balance],
    ['المتبقي من العقد', remaining],
    ['نسبة الإنجاز', `${progress}%`],
    ['هامش الربح', `${profitMargin}%`],
    [],
    ['رقم القيد', 'التاريخ', 'النوع', 'البيان', 'المبلغ'],
    ...rows.map((row) => [row.number, row.date, row.type, row.description, row.amount]),
  ]

  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows)
  sheet['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 44 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(workbook, sheet, 'تقرير المشروع')
  XLSX.writeFile(workbook, filename(project.name, 'xlsx'))
}

export function exportProjectReportWord(input: ExportInput) {
  const { project, summary, remaining, progress, profitMargin } = input.viewModel
  const rows = buildRows(input)
  if (rows.length === 0) throw new Error('لا توجد قيود متاحة للتصدير.')

  const facts: Array<[string, ExportCell]> = [
    ['المشروع', project.name],
    ['الكود', project.code || '—'],
    ['العميل', project.client || '—'],
    ['المدير', project.manager || '—'],
    ['الفترة', `${formatAccountingDate(project.startDate)} — ${formatAccountingDate(project.endDate)}`],
    ['قيمة العقد', project.contractValue],
    ['الإيرادات', summary.totalIncome],
    ['المصروفات', summary.totalExpense],
    ['صافي الحركة', summary.balance],
    ['المتبقي من العقد', remaining],
    ['نسبة الإنجاز', `${progress}%`],
    ['هامش الربح', `${profitMargin}%`],
  ]

  const factsHtml = facts
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('')
  const entriesHtml = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.number)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(row.amount)}</td></tr>`,
    )
    .join('')

  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;direction:rtl;color:#0f1e2b}h1{margin:0 0 16px}table{border-collapse:collapse;width:100%;margin:0 0 20px}th,td{border:1px solid #d8d2c8;padding:7px;text-align:right}th{background:#041c32;color:#fff}tbody th{width:22%;background:#f4efe5;color:#0f1e2b}</style></head><body><h1>تقرير مشروع ${escapeHtml(project.name)}</h1><table><tbody>${factsHtml}</tbody></table><table><thead><tr><th>رقم القيد</th><th>التاريخ</th><th>النوع</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>${entriesHtml}</tbody></table></body></html>`

  saveBlob(
    new Blob([`\uFEFF${html}`], { type: 'application/msword;charset=utf-8' }),
    filename(project.name, 'doc'),
  )
}

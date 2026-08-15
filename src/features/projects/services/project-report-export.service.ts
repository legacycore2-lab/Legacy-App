import type { ProjectDetailsViewModel, ProjectJournalViewModel } from '../types/project.types'
import { formatAccountingDate } from '../../../shared/date-utils'

type ExportInput = {
  viewModel: ProjectDetailsViewModel
  journalViewModel: ProjectJournalViewModel | null | undefined
}

type ExportRow = Record<string, string | number>

function buildRows({ viewModel, journalViewModel }: ExportInput): ExportRow[] {
  const entries = journalViewModel?.entries ?? []
  return entries.map((entry) => ({
    'رقم القيد': entry.seq ?? '—',
    التاريخ: formatAccountingDate(entry.entryDate),
    المشروع: viewModel.project.name,
    النوع: entry.type === 'income' ? 'إيراد' : entry.type === 'expense' ? 'مصروف' : 'غير معروف',
    البيان: entry.description || 'بدون بيان',
    المبلغ: entry.amount,
  }))
}

function filename(projectName: string, extension: string) {
  const safe = projectName.trim().replace(/\s+/g, '-') || 'project'
  return `project-report-${safe}.${extension}`
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
  const rows = buildRows(input)
  if (rows.length === 0) throw new Error('لا توجد قيود متاحة للتصدير.')
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'تقرير المشروع')
  XLSX.writeFile(workbook, filename(input.viewModel.project.name, 'xlsx'))
}

export function exportProjectReportWord(input: ExportInput) {
  const rows = buildRows(input)
  if (rows.length === 0) throw new Error('لا توجد قيود متاحة للتصدير.')
  const headers = Object.keys(rows[0])
  const body = rows
    .map((row) => `<tr>${headers.map((key) => `<td>${String(row[key] ?? '')}</td>`).join('')}</tr>`)
    .join('')
  const head = headers.map((key) => `<th>${key}</th>`).join('')
  const html = `<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
  saveBlob(new Blob([`\uFEFF${html}`], { type: 'application/msword;charset=utf-8' }), filename(input.viewModel.project.name, 'doc'))
}

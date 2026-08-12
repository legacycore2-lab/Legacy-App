import type { TabularRow } from '../types/report.types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(value: TabularRow[string]) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function downloadCsv(rows: TabularRow[], filename: string) {
  if (rows.length === 0) throw new Error('لا توجد بيانات متاحة للتصدير.')
  const headers = Object.keys(rows[0])
  const escape = (value: TabularRow[string]) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(',')),
  ].join('\r\n')
  downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), filename)
}

export async function downloadExcel(rows: TabularRow[], filename: string) {
  if (rows.length === 0) throw new Error('لا توجد بيانات متاحة للتصدير.')
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'التقرير')
  XLSX.writeFile(workbook, filename)
}

export function downloadWord(rows: TabularRow[], filename: string) {
  if (rows.length === 0) throw new Error('لا توجد بيانات متاحة للتصدير.')
  const headers = Object.keys(rows[0])
  const headerCells = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`,
    )
    .join('')
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;direction:rtl}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;text-align:right}th{font-weight:700}</style></head><body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`
  downloadBlob(
    new Blob([`\uFEFF${html}`], { type: 'application/msword;charset=utf-8' }),
    filename,
  )
}

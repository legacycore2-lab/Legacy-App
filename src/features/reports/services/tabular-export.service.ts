import type { TabularRow } from '../types/report.types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
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

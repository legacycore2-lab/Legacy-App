export type ExcelRow = Record<string, string | number | boolean | Date | null>
export type ExcelPreview = { fileName: string; sheetName: string; rows: ExcelRow[] }

export async function parseExcelWorkbook(buffer: ArrayBuffer, fileName: string): Promise<ExcelPreview> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName || !workbook.Sheets[sheetName]) throw new Error('لم يتم العثور على شيت صالح داخل الملف.')
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName], { defval: '' })
  if (rows.length === 0) throw new Error('الشيت المختار لا يحتوي على بيانات قابلة للاستيراد.')
  return { fileName, sheetName, rows }
}

export async function parseExcelFile(file: File): Promise<ExcelPreview> {
  return parseExcelWorkbook(await file.arrayBuffer(), file.name)
}

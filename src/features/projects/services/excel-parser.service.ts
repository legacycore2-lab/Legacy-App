export type ExcelRow = Record<string, string | number | boolean | Date | null>
export type ExcelPreview = { fileName: string; sheetName: string; rows: ExcelRow[] }

export async function parseExcelWorkbook(buffer: ArrayBuffer, fileName: string): Promise<ExcelPreview> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName || !workbook.Sheets[sheetName]) throw new Error('Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø´ÙŠØª ØµØ§Ù„Ø­ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ù„Ù.')
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName], { defval: '' })
  if (rows.length === 0) throw new Error('Ø§Ù„Ø´ÙŠØª Ø§Ù„Ù…Ø®ØªØ§Ø± Ù„Ø§ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§Øª Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯.')
  return { fileName, sheetName, rows }
}

export async function parseExcelFile(file: File): Promise<ExcelPreview> {
  return parseExcelWorkbook(await file.arrayBuffer(), file.name)
}

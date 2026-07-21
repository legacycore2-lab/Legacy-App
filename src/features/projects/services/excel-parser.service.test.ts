import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseExcelWorkbook } from './excel-parser.service'

function workbookBuffer(rows: Array<Record<string, string>>): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('parseExcelWorkbook', () => {
  it('returns the first sheet preview', async () => {
    const preview = await parseExcelWorkbook(workbookBuffer([{ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹: 'Ù‡Ø§ÙŠØ¯ Ø¨Ø§Ø±Ùƒ' }]), 'projects.xlsx')
    expect(preview).toMatchObject({ fileName: 'projects.xlsx', sheetName: 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹' })
    expect(preview.rows).toHaveLength(1)
  })

  it('rejects an empty sheet', async () =>
    await expect(parseExcelWorkbook(workbookBuffer([]), 'empty.xlsx')).rejects.toThrow())
})

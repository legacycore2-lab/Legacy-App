import { useMemo, useState } from 'react'
import { parseExcelFile, type ExcelRow } from '../services/excel-parser.service'

export function useExcelImport(onClose: () => void) {
  const [fileName, setFileName] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [rows, setRows] = useState<ExcelRow[]>([])
  const [error, setError] = useState('')
  const [isReading, setIsReading] = useState(false)
  const columns = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows])

  function resetAndClose() {
    setFileName('')
    setSheetName('')
    setRows([])
    setError('')
    setIsReading(false)
    onClose()
  }

  async function readFile(file: File) {
    setError('')
    setIsReading(true)

    try {
      const preview = await parseExcelFile(file)
      setFileName(preview.fileName)
      setSheetName(preview.sheetName)
      setRows(preview.rows)
    } catch (readError) {
      setFileName('')
      setSheetName('')
      setRows([])
      setError(readError instanceof Error ? readError.message : 'تعذر قراءة ملف Excel.')
    } finally {
      setIsReading(false)
    }
  }

  return {
    fileName,
    sheetName,
    rows,
    columns,
    error,
    isReading,
    resetAndClose,
    readFile,
  }
}

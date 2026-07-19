import { useMemo, useState } from 'react'
import { FileSpreadsheet, Upload, X } from 'lucide-react'
import * as XLSX from 'xlsx'

type Row = Record<string, string | number | boolean | null>
type Props = { open: boolean; onClose: () => void }

export function ExcelImportDialog({ open, onClose }: Props) {
  const [fileName, setFileName] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const columns = useMemo(() => rows.length ? Object.keys(rows[0]) : [], [rows])

  if (!open) return null

  async function readFile(file: File) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
    const firstSheet = workbook.SheetNames[0]
    const data = XLSX.utils.sheet_to_json<Row>(workbook.Sheets[firstSheet], { defval: '' })
    setFileName(file.name)
    setSheetName(firstSheet)
    setRows(data)
  }

  return <div className="excel-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="excel-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span>استيراد ذكي</span><h2>استيراد بيانات من Excel</h2><p>اقرأ الملف، راجع الأعمدة، ثم استورد بدون التأثير على أي وحدة أخرى.</p></div><button onClick={onClose} aria-label="إغلاق"><X/></button></header>
      <div className="excel-steps"><b className="is-active">1 رفع الملف</b><b className={rows.length ? 'is-active' : ''}>2 المعاينة</b><b>3 المطابقة</b><b>4 الاستيراد</b></div>
      <label className="excel-dropzone">
        <Upload size={30}/><strong>{fileName || 'اسحب ملف Excel هنا أو اضغط للاختيار'}</strong><small>.xlsx أو .xls</small>
        <input type="file" accept=".xlsx,.xls" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])}/>
      </label>
      {rows.length > 0 && <div className="excel-preview">
        <div className="excel-preview__meta"><span><FileSpreadsheet size={18}/> الشيت: {sheetName}</span><strong>{rows.length} سجل</strong></div>
        <div className="excel-preview__table"><table><thead><tr>{columns.slice(0, 7).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.slice(0, 6).map((row, index) => <tr key={index}>{columns.slice(0, 7).map((column) => <td key={column}>{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div>
      </div>}
      <footer><button className="projects-secondary-action" onClick={onClose}>إلغاء</button><button className="projects-primary-action" disabled={!rows.length}>متابعة لمطابقة الأعمدة</button></footer>
    </section>
  </div>
}

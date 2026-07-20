import { FileSpreadsheet, Upload, X } from 'lucide-react'
import { useExcelImport } from '../hooks/useExcelImport'
type Props = { open: boolean; onClose: () => void }

export function ExcelImportDialog({ open, onClose }: Props) {
  const { fileName, sheetName, rows, columns, error, isReading, resetAndClose, readFile } =
    useExcelImport(onClose)

  if (!open) return null

  return (
    <div className="excel-dialog-backdrop" role="presentation" onMouseDown={resetAndClose}>
      <section
        className="excel-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="excel-import-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>استيراد ذكي</span>
            <h2 id="excel-import-title">استيراد بيانات من Excel</h2>
            <p>اقرأ الملف وراجع البيانات قبل الانتقال إلى مطابقة الأعمدة.</p>
          </div>
          <button type="button" onClick={resetAndClose} aria-label="إغلاق">
            <X />
          </button>
        </header>

        <div className="excel-steps" aria-label="مراحل الاستيراد">
          <b className="is-active">1 رفع الملف</b>
          <b className={rows.length > 0 ? 'is-active' : ''}>2 المعاينة</b>
          <b>3 المطابقة</b>
          <b>4 الاستيراد</b>
        </div>

        <label className="excel-dropzone">
          <Upload size={30} />
          <strong>
            {isReading ? 'جاري قراءة الملف...' : fileName || 'اسحب ملف Excel هنا أو اضغط للاختيار'}
          </strong>
          <small>.xlsx أو .xls</small>
          <input
            type="file"
            accept=".xlsx,.xls"
            disabled={isReading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void readFile(file)
              event.target.value = ''
            }}
          />
        </label>

        {error && (
          <p className="excel-error" role="alert">
            {error}
          </p>
        )}

        {rows.length > 0 && (
          <div className="excel-preview">
            <div className="excel-preview__meta">
              <span>
                <FileSpreadsheet size={18} /> الشيت: {sheetName}
              </span>
              <strong>{rows.length} سجل</strong>
            </div>
            <div className="excel-preview__table">
              <table>
                <thead>
                  <tr>
                    {columns.slice(0, 7).map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 6).map((row, index) => (
                    <tr key={index}>
                      {columns.slice(0, 7).map((column) => (
                        <td key={column}>{String(row[column] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer>
          <button className="projects-secondary-action" type="button" onClick={resetAndClose}>
            إلغاء
          </button>
          <button className="projects-primary-action" type="button" disabled>
            مطابقة الأعمدة — المرحلة التالية
          </button>
        </footer>
      </section>
    </div>
  )
}

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { useJournalImport } from '../hooks/useJournalImport'

const number = new Intl.NumberFormat('ar-EG')
const money = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 })

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function JournalImportDialog({ isOpen, onClose }: Props) {
  const fileInputId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const { preview, isParsing, isDownloading, error, loadFile, downloadTemplate, reset } =
    useJournalImport()

  useEffect(() => {
    if (!isOpen) return

    const previousFocus = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  if (!isOpen) return null

  return (
    <div className="journal-import-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="journal-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-import-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="journal-import-header">
          <div>
            <span>استيراد جماعي</span>
            <h2 id="journal-import-title">استيراد القيود من Excel</h2>
            <p>حمّل النموذج الرسمي، املأه، ثم راجع كل صف قبل الاعتماد.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق نافذة الاستيراد">
            <X size={20} />
          </button>
        </header>

        <div className="journal-import-steps" aria-label="مراحل الاستيراد">
          <span className="is-active">1 تحميل النموذج</span>
          <span className={preview || isParsing ? 'is-active' : ''}>2 اختيار الملف</span>
          <span className={preview ? 'is-active' : ''}>3 المراجعة</span>
          <span>4 الاعتماد</span>
        </div>

        <div className="journal-import-actions">
          <button type="button" className="journal-import-template" onClick={downloadTemplate} disabled={isDownloading}>
            <Download size={18} />
            {isDownloading ? 'جارٍ إنشاء النموذج...' : 'تحميل نموذج Excel الرسمي'}
          </button>

          <label className="journal-import-upload" htmlFor={fileInputId}>
            <Upload size={20} />
            <strong>{isParsing ? 'جارٍ تحليل الملف...' : 'اختر ملف Excel'}</strong>
            <span>XLSX أو XLS · بحد أقصى 5 MB و1000 صف</span>
          </label>
          <input
            id={fileInputId}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            disabled={isParsing}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void loadFile(file)
              event.currentTarget.value = ''
            }}
          />
        </div>

        {error && (
          <div className="journal-import-message journal-import-message--error">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {!preview && !error && !isParsing && (
          <div className="journal-import-empty">
            <FileSpreadsheet size={42} />
            <h3>لم يتم اختيار ملف بعد</h3>
            <p>استخدم النموذج الرسمي لتجنب اختلاف أسماء الأعمدة والحسابات.</p>
          </div>
        )}

        {isParsing && <div className="journal-import-empty">جارٍ قراءة الملف والتحقق من المشاريع والحسابات...</div>}

        {preview && (
          <>
            <div className="journal-import-summary">
              <article>
                <span>إجمالي الصفوف</span>
                <strong>{number.format(preview.totalRows)}</strong>
              </article>
              <article className="is-valid">
                <span>صفوف صحيحة</span>
                <strong>{number.format(preview.validRows)}</strong>
              </article>
              <article className={preview.invalidRows > 0 ? 'is-invalid' : ''}>
                <span>صفوف بها أخطاء</span>
                <strong>{number.format(preview.invalidRows)}</strong>
              </article>
            </div>

            <div className="journal-import-file-name">
              <FileSpreadsheet size={17} /> {preview.fileName}
            </div>

            <div className="journal-import-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>صف Excel</th>
                    <th>المشروع</th>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>البند</th>
                    <th>البيان</th>
                    <th>طريقة الدفع</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.excelRow} className={row.status === 'invalid' ? 'is-invalid' : ''}>
                      <td>{number.format(row.excelRow)}</td>
                      <td>{row.project || '—'}</td>
                      <td>{row.date || '—'}</td>
                      <td>{row.type === 'income' ? 'إيراد' : row.type === 'expense' ? 'مصروف' : '—'}</td>
                      <td>{row.category || '—'}</td>
                      <td>{row.description || '—'}</td>
                      <td>{row.paymentMethod || '—'}</td>
                      <td>{row.amount === null ? '—' : `${money.format(row.amount)} ج.م`}</td>
                      <td>
                        {row.status === 'valid' ? (
                          <span className="journal-import-status is-valid"><CheckCircle2 size={14} /> صالح</span>
                        ) : (
                          <div className="journal-import-errors">
                            <span className="journal-import-status is-invalid"><AlertTriangle size={14} /> خطأ</span>
                            {row.errors.map((rowError) => <small key={rowError}>{rowError}</small>)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="journal-import-footer">
              <p>
                الاعتماد النهائي متوقف مؤقتًا حتى إضافة RPC ذرية تحفظ جميع الصفوف أو تلغيها كلها عند أي فشل.
              </p>
              <button type="button" disabled title="يتطلب موافقة على RPC خاصة بالاستيراد الذري">
                اعتماد الاستيراد
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

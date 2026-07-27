import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef } from 'react'
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
  const {
    preview,
    isParsing,
    isDownloading,
    isImporting,
    error,
    success,
    loadFile,
    downloadTemplate,
    importEntries,
    reset,
  } = useJournalImport()

  const errorSummary = useMemo(() => {
    if (!preview) return []

    const counts = new Map<string, number>()
    preview.rows.forEach((row) => {
      row.errors.forEach((rowError) => {
        counts.set(rowError, (counts.get(rowError) ?? 0) + 1)
      })
    })

    return [...counts.entries()].sort((first, second) => second[1] - first[1])
  }, [preview])

  useEffect(() => {
    if (!isOpen) return

    const previousFocus = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isImporting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [isImporting, isOpen, onClose])

  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  if (!isOpen) return null

  const canImport = Boolean(preview?.canImport && !success && !isImporting)

  return (
    <div
      className="journal-import-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!isImporting) onClose()
      }}
    >
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
            <p>استخدم النموذج الرسمي لأنه يتضمن أسماء المشاريع والحسابات الفعلية من النظام.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق نافذة الاستيراد" disabled={isImporting}>
            <X size={20} />
          </button>
        </header>

        <div className="journal-import-steps" aria-label="مراحل الاستيراد">
          <span className="is-active">1 تحميل النموذج</span>
          <span className={preview || isParsing ? 'is-active' : ''}>2 اختيار الملف</span>
          <span className={preview ? 'is-active' : ''}>3 المراجعة</span>
          <span className={success || isImporting ? 'is-active' : ''}>4 الاعتماد</span>
        </div>

        <div className="journal-import-actions">
          <button
            type="button"
            className="journal-import-template"
            onClick={downloadTemplate}
            disabled={isDownloading || isImporting}
          >
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
            disabled={isParsing || isImporting}
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

        {success && (
          <div className="journal-import-message journal-import-message--success">
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        {!preview && !error && !isParsing && (
          <div className="journal-import-empty">
            <FileSpreadsheet size={42} />
            <h3>لم يتم اختيار ملف بعد</h3>
            <p>حمّل النموذج الرسمي أولًا لضمان مطابقة المشاريع وحسابات البنود والدفع.</p>
          </div>
        )}

        {isParsing && (
          <div className="journal-import-empty">جارٍ قراءة الملف والتحقق من المشاريع والحسابات...</div>
        )}

        {preview && (
          <>
            <div className="journal-import-summary">
              <article className="is-total">
                <span>إجمالي الصفوف</span>
                <strong>{number.format(preview.totalRows)}</strong>
              </article>
              <article className="is-valid">
                <span>صفوف صحيحة</span>
                <strong>{number.format(preview.validRows)}</strong>
              </article>
              <article className="is-invalid">
                <span>صفوف بها أخطاء</span>
                <strong>{number.format(preview.invalidRows)}</strong>
              </article>
            </div>

            <div className="journal-import-file-name">
              <FileSpreadsheet size={17} /> {preview.fileName}
            </div>

            {errorSummary.length > 0 && (
              <section className="journal-import-error-summary" aria-labelledby="journal-import-errors-title">
                <div>
                  <AlertTriangle size={18} />
                  <strong id="journal-import-errors-title">ملخص الأخطاء</strong>
                </div>
                <ul>
                  {errorSummary.map(([message, count]) => (
                    <li key={message}>
                      <span>{message}</span>
                      <b>{number.format(count)}</b>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="journal-import-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th aria-label="حالة الصف">الحالة</th>
                    <th>صف Excel</th>
                    <th>المشروع</th>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>البند</th>
                    <th>البيان</th>
                    <th>طريقة الدفع</th>
                    <th>المبلغ</th>
                    <th>تفاصيل التحقق</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.excelRow} className={row.status === 'invalid' ? 'is-invalid' : ''}>
                      <td>
                        <span
                          className={`journal-import-row-icon ${row.status === 'valid' ? 'is-valid' : 'is-invalid'}`}
                          title={row.status === 'valid' ? 'صف صالح' : 'صف به أخطاء'}
                          aria-label={row.status === 'valid' ? 'صف صالح' : 'صف به أخطاء'}
                        >
                          {row.status === 'valid' ? <CheckCircle2 size={17} /> : <X size={17} />}
                        </span>
                      </td>
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
                          <span className="journal-import-status is-valid">
                            <CheckCircle2 size={14} /> جاهز للاستيراد
                          </span>
                        ) : (
                          <div className="journal-import-errors">
                            {row.errors.map((rowError) => (
                              <small key={rowError}>
                                <AlertTriangle size={12} /> {rowError}
                              </small>
                            ))}
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
                {preview.canImport
                  ? 'سيتم حفظ جميع القيود في عملية ذرية واحدة. عند فشل أي صف لن يتم حفظ أي قيد.'
                  : `لا يمكن الاعتماد الآن: أصلح ${number.format(preview.invalidRows)} صف ثم ارفع الملف مرة أخرى.`}
              </p>
              <button type="button" disabled={!canImport} onClick={() => void importEntries()}>
                {isImporting ? 'جارٍ اعتماد القيود...' : 'اعتماد الاستيراد'}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

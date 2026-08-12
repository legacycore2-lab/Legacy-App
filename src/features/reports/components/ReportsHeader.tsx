import { ChevronDown, Download, FileText, Printer, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatTimestamp } from '../../../shared/date-utils'

type Props = {
  onRefresh: () => void | Promise<void>
  onExportPdf?: () => void
  onExportExcel?: () => void
  onExportWord?: () => void
  lastUpdated?: Date | null
  isExporting?: boolean
}

export function ReportsHeader({
  onRefresh,
  onExportPdf,
  onExportExcel,
  onExportWord,
  lastUpdated,
  isExporting = false,
}: Props) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exportOpen])

  useEffect(() => {
    if (!exportOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setExportOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [exportOpen])

  function closeAndRun(action?: () => void) {
    setExportOpen(false)
    action?.()
  }

  return (
    <header className="rh">
      <div className="rh__text">
        <span className="rh__eyebrow">مركز التقارير</span>
        <h1 className="rh__title">التقارير</h1>
        {lastUpdated ? (
          <p className="rh__meta">آخر تحديث: {formatTimestamp(lastUpdated)}</p>
        ) : (
          <p className="rh__meta">تقارير مباشرة من البيانات المسجلة في النظام</p>
        )}
      </div>

      <div className="rh__actions">
        <button type="button" className="rh-btn" onClick={onRefresh} aria-label="تحديث البيانات">
          <RefreshCw size={15} />
          <span>تحديث</span>
        </button>

        <button
          type="button"
          className="rh-btn"
          onClick={() => window.print()}
          aria-label="طباعة"
          data-action="print"
        >
          <Printer size={15} />
          <span>طباعة</span>
        </button>

        <div className="rh-export" ref={exportRef}>
          <button
            type="button"
            className="rh-btn is-primary"
            onClick={() => setExportOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={exportOpen}
          >
            <Download size={15} />
            <span>تصدير</span>
            <ChevronDown size={13} className={`rh-chevron${exportOpen ? ' is-open' : ''}`} />
          </button>

          {exportOpen && (
            <ul className="rh-dropdown" role="menu">
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => closeAndRun(onExportPdf)}
                  disabled={isExporting || !onExportPdf}
                  className="rh-dropdown__item"
                  data-action="export-pdf"
                >
                  <FileText size={14} />
                  {isExporting ? 'جارٍ التصدير...' : 'PDF'}
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => closeAndRun(onExportExcel)}
                  disabled={isExporting || !onExportExcel}
                  className="rh-dropdown__item"
                >
                  <FileText size={14} />
                  Excel
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => closeAndRun(onExportWord)}
                  disabled={isExporting || !onExportWord}
                  className="rh-dropdown__item"
                >
                  <FileText size={14} />
                  Word
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  )
}

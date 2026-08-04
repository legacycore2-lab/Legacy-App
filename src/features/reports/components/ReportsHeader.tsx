import { ChevronDown, Download, FileSpreadsheet, FileText, Printer, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatTimestamp } from '../../../shared/date-utils'

type Props = {
  onRefresh: () => void
  lastUpdated?: Date | null
}

export function ReportsHeader({ onRefresh, lastUpdated }: Props) {
  const [exportOpen, setExportOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  function handleExport(format: 'pdf' | 'excel' | 'csv') {
    setExportOpen(false)
    window.print()
    void format
  }

  return (
    <header className="rh">
      <div className="rh__text">
        <span className="rh__eyebrow">مركز التقارير والتحليلات</span>
        <h1 className="rh__title">التقارير</h1>
        {lastUpdated ? (
          <p className="rh__meta">آخر تحديث: {formatTimestamp(lastUpdated)}</p>
        ) : (
          <p className="rh__meta">ملخص مالي مباشر من القيود المسجلة</p>
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
        >
          <Printer size={15} />
          <span>طباعة</span>
        </button>

        <div className="rh-export" ref={dropRef}>
          <button
            type="button"
            className="rh-btn is-primary"
            onClick={() => setExportOpen((o) => !o)}
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
                  onClick={() => handleExport('pdf')}
                  className="rh-dropdown__item"
                >
                  <FileText size={14} />
                  PDF
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleExport('excel')}
                  className="rh-dropdown__item"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleExport('csv')}
                  className="rh-dropdown__item"
                >
                  <FileText size={14} />
                  CSV
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  )
}

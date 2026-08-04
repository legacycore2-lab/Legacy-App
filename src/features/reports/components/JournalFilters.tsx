import { RotateCcw, Search } from 'lucide-react'
import type { JournalReportFilters } from '../types/report.types'

type Props = {
  filters: JournalReportFilters
  hasActiveFilter: boolean
  filtersDirty: boolean
  contractors: string[]
  paymentMethods: string[]
  projectOptions: { id: string; name: string }[]
  onSetFilter: <K extends keyof JournalReportFilters>(key: K, value: JournalReportFilters[K]) => void
  onSearch: () => void
  onReset: () => void
}

// prettier-ignore
export function JournalFilters({
  filters, hasActiveFilter, filtersDirty, contractors, paymentMethods,
  projectOptions, onSetFilter, onSearch, onReset,
}: Props) {
  return (
    <div className="jf-bar">
      {/* Row 1: date + project + contractor + payment + type */}
      <div className="jf-row">
        <div className="jf-group">
          <label className="jf-label">الفترة</label>
          <div className="jf-date-range">
            <input type="date" className="jf-input" value={filters.dateFrom}
              onChange={(e) => onSetFilter('dateFrom', e.target.value)} title="من" />
            <span className="jf-date-sep">—</span>
            <input type="date" className="jf-input" value={filters.dateTo}
              onChange={(e) => onSetFilter('dateTo', e.target.value)} title="إلى" />
          </div>
        </div>

        {projectOptions.length > 0 && (
          <div className="jf-group">
            <label className="jf-label">المشروع</label>
            <select className="jf-select" value={filters.projectId}
              onChange={(e) => onSetFilter('projectId', e.target.value)}>
              <option value="">الكل</option>
              {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {contractors.length > 0 && (
          <div className="jf-group">
            <label className="jf-label">المقاول</label>
            <select className="jf-select" value={filters.contractorName}
              onChange={(e) => onSetFilter('contractorName', e.target.value)}>
              <option value="">الكل</option>
              {contractors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {paymentMethods.length > 0 && (
          <div className="jf-group">
            <label className="jf-label">طريقة الدفع</label>
            <select className="jf-select" value={filters.paymentMethod}
              onChange={(e) => onSetFilter('paymentMethod', e.target.value)}>
              <option value="">الكل</option>
              {paymentMethods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        <div className="jf-group">
          <label className="jf-label">النوع</label>
          <select className="jf-select" value={filters.entryType}
            onChange={(e) => onSetFilter('entryType', e.target.value as 'all' | 'income' | 'expense')}>
            <option value="all">الكل</option>
            <option value="income">إيرادات</option>
            <option value="expense">مصروفات</option>
          </select>
        </div>
      </div>

      {/* Row 2: search input + search button + reset */}
      <div className="jf-row jf-row--search">
        <label className="jf-search">
          <Search size={15} />
          <input value={filters.query} onChange={(e) => onSetFilter('query', e.target.value)}
            placeholder="بحث في الوصف أو المقاول أو المشروع..."
            onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }} />
        </label>
        <button type="button" className="jf-search-btn" onClick={onSearch}>
          <Search size={14} aria-hidden />
          بحث
        </button>
        {hasActiveFilter && (
          <button type="button" className="jf-reset" onClick={onReset}>
            <RotateCcw size={13} />
            إعادة الضبط
          </button>
        )}
      </div>

      {/* Dirty indicator */}
      {filtersDirty && (
        <p className="jf-dirty-hint" role="status">
          تم تعديل الفلاتر، اضغط بحث لتحديث النتائج.
        </p>
      )}
    </div>
  )
}

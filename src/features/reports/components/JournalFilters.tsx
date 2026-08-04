import { Search, X } from 'lucide-react'
import type { JournalReportFilters } from '../types/report.types'

type Props = {
  filters: JournalReportFilters
  hasActiveFilter: boolean
  contractors: string[]
  paymentMethods: string[]
  projectOptions: { id: string; name: string }[]
  onSetFilter: <K extends keyof JournalReportFilters>(key: K, value: JournalReportFilters[K]) => void
  onReset: () => void
}

// prettier-ignore
export function JournalFilters({
  filters,
  hasActiveFilter,
  contractors,
  paymentMethods,
  projectOptions,
  onSetFilter,
  onReset,
}: Props) {
  return (
    <div className="reports-journal-filters">
      <label className="reports-search reports-search--sm">
        <Search size={15} />
        <input
          value={filters.query}
          onChange={(e) => onSetFilter('query', e.target.value)}
          placeholder="بحث في الوصف أو المقاول..."
        />
      </label>

      <input
        type="date"
        className="reports-input-date"
        value={filters.dateFrom}
        onChange={(e) => onSetFilter('dateFrom', e.target.value)}
        title="من تاريخ"
      />
      <input
        type="date"
        className="reports-input-date"
        value={filters.dateTo}
        onChange={(e) => onSetFilter('dateTo', e.target.value)}
        title="إلى تاريخ"
      />

      <select
        className="reports-select"
        value={filters.entryType}
        onChange={(e) => onSetFilter('entryType', e.target.value as 'all' | 'income' | 'expense')}
      >
        <option value="all">كل الأنواع</option>
        <option value="income">إيرادات</option>
        <option value="expense">مصروفات</option>
      </select>

      {projectOptions.length > 0 && (
        <select
          className="reports-select"
          value={filters.projectId}
          onChange={(e) => onSetFilter('projectId', e.target.value)}
        >
          <option value="">كل المشاريع</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {contractors.length > 0 && (
        <select
          className="reports-select"
          value={filters.contractorName}
          onChange={(e) => onSetFilter('contractorName', e.target.value)}
        >
          <option value="">كل المقاولين</option>
          {contractors.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {paymentMethods.length > 0 && (
        <select
          className="reports-select"
          value={filters.paymentMethod}
          onChange={(e) => onSetFilter('paymentMethod', e.target.value)}
        >
          <option value="">كل طرق الدفع</option>
          {paymentMethods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}

      {hasActiveFilter && (
        <button type="button" className="reports-reset-btn" onClick={onReset}>
          <X size={14} />
          إعادة الضبط
        </button>
      )}
    </div>
  )
}

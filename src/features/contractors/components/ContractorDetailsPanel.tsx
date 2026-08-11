import { AlertCircle, ArrowDownLeft, ArrowUpRight, ExternalLink, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { Contractor, ContractorEntry, ContractorEntryFilters } from '../types/contractor.types'

type Props = {
  contractor: Contractor
  entries: ContractorEntry[]
  filters: ContractorEntryFilters
  page: number
  totalPages: number
  totalCount: number
  onFiltersChange: (filters: ContractorEntryFilters) => void
  onResetFilters: () => void
  onPreviousPage: () => void
  onNextPage: () => void
  onClose: () => void
}

export function ContractorDetailsPanel({
  contractor,
  entries,
  filters,
  page,
  totalPages,
  totalCount,
  onFiltersChange,
  onResetFilters,
  onPreviousPage,
  onNextPage,
  onClose,
}: Props) {
  const navigate = useNavigate()
  const hasFilters = Boolean(filters.projectId || filters.dateFrom || filters.dateTo)

  return (
    <aside className="contractor-panel" aria-label={`تفاصيل المقاول: ${contractor.name}`}>
      <div className="contractor-panel__header">
        <div>
          <span>تفاصيل المقاول</span>
          <h2>{contractor.name}</h2>
        </div>
        <button type="button" className="contractor-panel__close" onClick={onClose} aria-label="إغلاق">
          <X size={18} />
        </button>
      </div>

      <div className="contractor-panel__kpis">
        <div className="contractor-panel__kpi">
          <small>إجمالي الإيرادات</small>
          <strong className="is-income">{formatMoneyInteger(contractor.totalIncome)}</strong>
        </div>
        <div className="contractor-panel__kpi">
          <small>إجمالي المصروفات</small>
          <strong className="is-expense">{formatMoneyInteger(contractor.totalExpense)}</strong>
        </div>
        <div className="contractor-panel__kpi">
          <small>صافي الحركة</small>
          <strong className={contractor.netMovement >= 0 ? 'is-income' : 'is-expense'}>
            {formatMoneyInteger(contractor.netMovement)}
          </strong>
        </div>
        <div className="contractor-panel__kpi">
          <small>عدد القيود</small>
          <strong>{contractor.entryCount}</strong>
        </div>
      </div>

      {contractor.projects.length > 0 && (
        <section className="contractor-panel__section">
          <h3>المشاريع المرتبطة</h3>
          <ul className="contractor-panel__project-list">
            {contractor.projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="contractor-panel__project-link"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  {p.name}
                  <ExternalLink size={12} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="contractor-panel__section">
        <div className="contractor-panel__section-head">
          <h3>القيود ({totalCount})</h3>
          {hasFilters && (
            <button type="button" className="contractor-panel__reset" onClick={onResetFilters}>
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="contractor-panel__filters">
          <select
            aria-label="فلترة حسب المشروع"
            value={filters.projectId}
            onChange={(event) => onFiltersChange({ ...filters, projectId: event.target.value })}
          >
            <option value="">كل المشاريع</option>
            {contractor.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <input
            aria-label="من تاريخ"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onFiltersChange({ ...filters, dateFrom: event.target.value })}
          />
          <input
            aria-label="إلى تاريخ"
            type="date"
            value={filters.dateTo}
            onChange={(event) => onFiltersChange({ ...filters, dateTo: event.target.value })}
          />
        </div>

        <div className="contractor-panel__entries">
          {entries.map((entry) => (
            <div key={entry.id} className={`contractor-panel__entry is-${entry.entryType}`}>
              <span className="contractor-panel__entry-icon">
                {entry.entryType === 'income' ? (
                  <ArrowDownLeft size={14} />
                ) : entry.entryType === 'expense' ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <AlertCircle size={14} aria-label="نوع القيد غير معروف" />
                )}
              </span>
              <div className="contractor-panel__entry-body">
                <span>{entry.description || '—'}</span>
                {entry.projectName && <small>{entry.projectName}</small>}
              </div>
              <div className="contractor-panel__entry-meta">
                <strong>{formatMoneyInteger(entry.amount)}</strong>
                <small>{formatAccountingDate(entry.entryDate)}</small>
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="contractor-panel__empty">لا توجد قيود مطابقة للفلاتر.</p>}
        </div>

        {totalPages > 1 && (
          <div className="contractor-panel__pagination">
            <button type="button" onClick={onPreviousPage} disabled={page <= 1}>
              → السابق
            </button>
            <span>
              صفحة {page.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}
            </span>
            <button type="button" onClick={onNextPage} disabled={page >= totalPages}>
              التالي ←
            </button>
          </div>
        )}
      </section>
    </aside>
  )
}

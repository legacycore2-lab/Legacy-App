import { AlertCircle, ArrowDownLeft, ArrowUpRight, ExternalLink, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { Contractor } from '../types/contractor.types'

type Props = {
  contractor: Contractor
  onClose: () => void
}

export function ContractorDetailsPanel({ contractor, onClose }: Props) {
  const navigate = useNavigate()

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

      {/* ── KPIs ── */}
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

      {/* ── Projects ── */}
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

      {/* ── Entries ── */}
      <section className="contractor-panel__section">
        <h3>القيود ({contractor.entryCount})</h3>
        <div className="contractor-panel__entries">
          {contractor.entries.map((entry) => (
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
        </div>
      </section>
    </aside>
  )
}

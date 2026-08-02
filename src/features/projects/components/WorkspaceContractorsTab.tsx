import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  HardHat,
  Loader2,
  ShieldOff,
} from 'lucide-react'
import { useProjectContractors } from '../hooks/useProjectContractors'
import type { ContractorEntry, ProjectContractor } from '../types/project-contractor.types'

type Props = { projectId: string }

const money = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function formatDate(dateKey: string): string {
  const parts = dateKey.slice(0, 10).split('-').map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  if (!y) return dateKey
  return dateFormatter.format(new Date(Date.UTC(y, m - 1, d)))
}

function EntryTypeIcon({ type }: { type: ContractorEntry['entryType'] }) {
  if (type === 'income') return <ArrowDownLeft size={13} />
  if (type === 'expense') return <ArrowUpRight size={13} />
  return <AlertCircle size={13} aria-label="نوع القيد غير معروف" />
}

function ContractorCard({
  contractor,
  isExpanded,
  onToggle,
}: {
  contractor: ProjectContractor
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <article className="project-contractor-card">
      {/* ── Card header — click to expand ── */}
      <button
        type="button"
        className="project-contractor-card__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="project-contractor-card__icon">
          <HardHat size={16} />
        </span>
        <div className="project-contractor-card__name">
          <strong>{contractor.name}</strong>
          <small>
            {contractor.entryCount} قيد · آخر حركة {formatDate(contractor.latestActivityDate)}
          </small>
        </div>
        <div className="project-contractor-card__totals">
          {contractor.totalExpense > 0 && (
            <span className="is-expense">{money.format(contractor.totalExpense)}</span>
          )}
          {contractor.totalIncome > 0 && (
            <span className="is-income">{money.format(contractor.totalIncome)}</span>
          )}
        </div>
        <span className="project-contractor-card__chevron">
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* ── Expanded entries ── */}
      {isExpanded && (
        <div className="project-contractor-card__entries">
          <table className="project-contractor-entries-table">
            <thead>
              <tr>
                <th scope="col">رقم القيد</th>
                <th scope="col">التاريخ</th>
                <th scope="col">البيان</th>
                <th scope="col">النوع</th>
                <th scope="col">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {contractor.entries.map((entry) => (
                <tr key={entry.id} className={`entry-row--${entry.entryType}`}>
                  <td data-label="رقم القيد">{entry.seq != null ? `#${entry.seq}` : '—'}</td>
                  <td data-label="التاريخ">{formatDate(entry.entryDate)}</td>
                  <td data-label="البيان">{entry.description || '—'}</td>
                  <td data-label="النوع">
                    <span className={`entry-type-badge entry-type-badge--${entry.entryType}`}>
                      <EntryTypeIcon type={entry.entryType} />
                      {entry.entryType === 'income'
                        ? 'إيراد'
                        : entry.entryType === 'expense'
                          ? 'مصروف'
                          : 'غير معروف'}
                    </span>
                  </td>
                  <td data-label="المبلغ">
                    <span className={entry.entryType !== 'unknown' ? `is-${entry.entryType}` : ''}>
                      {money.format(entry.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

export function WorkspaceContractorsTab({ projectId }: Props) {
  const { viewModel, expandedKey, toggleExpanded, isLoading, error } = useProjectContractors(projectId)

  // ── Permission error ──
  if (error && (error.includes('permission') || error.includes('RLS') || error.includes('policy'))) {
    return (
      <div className="workspace-contractors__permission">
        <ShieldOff size={36} />
        <strong>غير مصرح بعرض بيانات المقاولين</strong>
        <span>تحتاج صلاحية محاسب أو أعلى للوصول إلى هذا القسم.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="workspace-contractors__error" role="alert">
        {error}
      </div>
    )
  }

  return (
    <div className="workspace-contractors">
      {/* ── Header ── */}
      <div className="workspace-contractors__header">
        <div>
          <span>قيود المشروع</span>
          <h2>المقاولون</h2>
        </div>
        <p className="workspace-contractors__note">البيانات مستخرجة من القيود المسجلة لهذا المشروع.</p>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="workspace-contractors__loading">
          <Loader2 size={22} className="spin" />
          <span>جارٍ تحميل بيانات المقاولين…</span>
        </div>
      )}

      {/* ── KPIs ── */}
      {!isLoading && viewModel && viewModel.hasData && (
        <div className="workspace-contractors__kpis">
          <div className="workspace-contractors__kpi">
            <small>عدد المقاولين</small>
            <strong>{viewModel.totalContractors}</strong>
          </div>
          <div className="workspace-contractors__kpi">
            <small>إجمالي المصروفات</small>
            <strong className="is-expense">{money.format(viewModel.totalExpense)}</strong>
          </div>
          <div className="workspace-contractors__kpi">
            <small>إجمالي الإيرادات</small>
            <strong className="is-income">{money.format(viewModel.totalIncome)}</strong>
          </div>
          <div className="workspace-contractors__kpi">
            <small>عدد القيود</small>
            <strong>{viewModel.totalEntries}</strong>
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && viewModel && !viewModel.hasData && (
        <div className="workspace-contractors__empty">
          <HardHat size={34} />
          <strong>لا توجد بيانات مقاولين لهذا المشروع</strong>
          <span>ستظهر هنا أسماء المقاولين المدخلة في القيود اليومية.</span>
        </div>
      )}

      {/* ── Contractors list ── */}
      {!isLoading && viewModel && viewModel.hasData && (
        <div className="workspace-contractors__list">
          {viewModel.contractors.map((c) => (
            <ContractorCard
              key={c.key}
              contractor={c}
              isExpanded={expandedKey === c.key}
              onToggle={() => toggleExpanded(c.key)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

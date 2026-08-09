import { useMemo, useState } from 'react'
import { AlertTriangle, HandCoins, Plus, ReceiptText, RotateCcw, WalletCards } from 'lucide-react'
import { useAdvances } from '../hooks/useAdvances'
import type { Advance, AdvanceFilters, AdvanceStatus } from '../types/advances.types'
import '../styles/advances.css'

const money = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
})
const date = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
const labels: Record<AdvanceStatus, string> = { open: 'مفتوحة', overdue: 'متأخرة', settled: 'تمت التسوية' }
function formattedDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`)
  return !value || Number.isNaN(parsed.getTime()) ? '—' : date.format(parsed)
}

function Details({ advance }: { advance: Advance }) {
  return (
    <aside className="advance-details" aria-label="تفاصيل العهدة">
      <div className="advance-details__head">
        <span>{advance.number}</span>
        <h2>{advance.holderName}</h2>
        <p>{advance.holderTitle}</p>
        <div className="advance-project-tags">
          {advance.projectNames.map((project) => (
            <span key={project}>{project}</span>
          ))}
        </div>
      </div>
      <div className="advance-details__remaining">
        <span>المبلغ المتبقي</span>
        <strong>{money.format(advance.remaining)}</strong>
      </div>
      <div className="advance-progress">
        <span style={{ width: `${advance.progress}%` }} />
      </div>
      <p className="muted">تمت تسوية {advance.progress}% من قيمة العهدة</p>
      <dl className="advance-facts">
        <div>
          <dt>إجمالي العهدة</dt>
          <dd>{money.format(advance.amount)}</dd>
        </div>
        <div>
          <dt>المصروف</dt>
          <dd>{money.format(advance.spent)}</dd>
        </div>
        <div>
          <dt>تاريخ الصرف</dt>
          <dd>{formattedDate(advance.issueDate)}</dd>
        </div>
        <div>
          <dt>الاستحقاق</dt>
          <dd>{formattedDate(advance.dueDate)}</dd>
        </div>
      </dl>
      <div>
        <span className="muted">الغرض</span>
        <p>{advance.purpose}</p>
      </div>
      <div className="advance-details__actions">
        <button type="button" className="advance-primary" disabled>
          <ReceiptText size={17} /> تسجيل مصروف
        </button>
        <button type="button" className="advance-secondary" disabled>
          <RotateCcw size={17} /> رد المبلغ المتبقي
        </button>
      </div>
      <p className="muted">التسجيل والتسوية سيتم تفعيلهما في المرحلة المحاسبية التالية.</p>
    </aside>
  )
}

export function AdvancesPage() {
  const [filters, setFilters] = useState<AdvanceFilters>({ search: '', status: 'all', project: 'all' })
  const [selectedId, setSelectedId] = useState('')
  const { data, isLoading, error } = useAdvances(filters)
  const selected = useMemo(
    () => data?.advances.find((item) => item.id === selectedId) ?? data?.filteredAdvances[0],
    [data, selectedId],
  )
  return (
    <main className="advances-page">
      <header className="advances-header">
        <div>
          <span className="advances-eyebrow">العمليات المالية</span>
          <h1>إدارة العُهد والسلف</h1>
          <p>متابعة الصرف والمصروفات والتسويات من مكان واحد.</p>
        </div>
        <button type="button" className="advance-primary" disabled>
          <Plus size={18} /> صرف عهدة جديدة
        </button>
      </header>
      <div className="advances-notice">
        الصفحة متصلة ببيانات العُهد. الصرف والتسوية سيظلان غير متاحين حتى اكتمال دورة القيود المحاسبية.
      </div>
      {error && (
        <div className="advances-error" role="alert">
          {error}
        </div>
      )}
      <section className="advance-metrics">
        <article>
          <HandCoins />
          <span>العُهد المفتوحة</span>
          <strong>{data?.summary.openCount ?? 0}</strong>
          <small>عهدة قيد المتابعة</small>
        </article>
        <article>
          <ReceiptText />
          <span>إجمالي المصروف</span>
          <strong>{money.format(data?.summary.totalSpent ?? 0)}</strong>
          <small>من العُهد المسجلة</small>
        </article>
        <article>
          <WalletCards />
          <span>إجمالي المتبقي</span>
          <strong>{money.format(data?.summary.totalRemaining ?? 0)}</strong>
          <small>قيد التسوية</small>
        </article>
        <article className="is-danger">
          <AlertTriangle />
          <span>عُهد متأخرة</span>
          <strong>{data?.summary.overdueCount ?? 0}</strong>
          <small>تحتاج متابعة</small>
        </article>
      </section>
      <div className="advances-workspace">
        <section className="advances-list">
          <div className="advances-filters">
            <input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="ابحث بصاحب العهدة أو المشروع..."
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as AdvanceFilters['status'] })}
            >
              <option value="all">جميع الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="overdue">متأخرة</option>
              <option value="settled">تمت التسوية</option>
            </select>
            <select
              value={filters.project}
              onChange={(e) => setFilters({ ...filters, project: e.target.value })}
            >
              <option value="all">جميع المشاريع</option>
              {data?.projects.map((project) => (
                <option key={project}>{project}</option>
              ))}
            </select>
          </div>
          <div className="advances-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>صاحب العهدة</th>
                  <th>المشاريع</th>
                  <th>تاريخ الصرف</th>
                  <th>قيمة العهدة</th>
                  <th>المصروف</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data?.filteredAdvances.map((advance) => (
                  <tr
                    key={advance.id}
                    className={selected?.id === advance.id ? 'is-selected' : ''}
                    onClick={() => setSelectedId(advance.id)}
                  >
                    <td>
                      <strong>{advance.holderName}</strong>
                      <small>{advance.holderTitle}</small>
                    </td>
                    <td>{advance.projectNames.join('، ')}</td>
                    <td>{formattedDate(advance.issueDate)}</td>
                    <td>{money.format(advance.amount)}</td>
                    <td>{money.format(advance.spent)}</td>
                    <td>{money.format(advance.remaining)}</td>
                    <td>
                      <span className={`advance-status advance-status--${advance.status}`}>
                        {labels[advance.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && data?.filteredAdvances.length === 0 && (
                  <tr>
                    <td colSpan={7} className="advances-empty">
                      لا توجد عُهد مطابقة للبحث.
                    </td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="advances-empty">
                      جاري تحميل العُهد...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        {selected ? (
          <Details advance={selected} />
        ) : (
          <aside className="advance-details advance-details--empty">
            <HandCoins size={32} />
            <p>اختر عهدة لعرض تفاصيلها.</p>
          </aside>
        )}
      </div>
    </main>
  )
}

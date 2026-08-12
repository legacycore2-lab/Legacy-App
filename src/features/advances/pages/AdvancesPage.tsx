import { useState } from 'react'
import { AlertTriangle, HandCoins, Plus, ReceiptText, RotateCcw, WalletCards } from 'lucide-react'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoney } from '../../../shared/formatters'
import { AdvanceMovementDialog, CreateAdvanceDialog } from '../components/AdvanceDialogs'
import { AdvanceTransactionHistory } from '../components/AdvanceTransactionHistory'
import { useAdvances } from '../hooks/useAdvances'
import { useAdvanceTransactions } from '../hooks/useAdvanceTransactions'
import type { Advance, AdvanceFilters } from '../types/advances.types'
import '../styles/advances.css'

const labels = { open: 'مفتوحة', overdue: 'متأخرة', settled: 'تمت التسوية' }

function Details({
  advance,
  onExpense,
  onReturn,
  history,
}: {
  advance: Advance
  onExpense: () => void
  onReturn: () => void
  history: ReturnType<typeof useAdvanceTransactions>
}) {
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
        <strong>{formatMoney(advance.remaining)}</strong>
      </div>
      <div className="advance-progress">
        <span style={{ width: `${advance.progress}%` }} />
      </div>
      <p className="muted">تمت تسوية {advance.progress}% من قيمة العهدة</p>
      <dl className="advance-facts">
        <div>
          <dt>إجمالي العهدة</dt>
          <dd>{formatMoney(advance.amount)}</dd>
        </div>
        <div>
          <dt>المصروف</dt>
          <dd>{formatMoney(advance.spent)}</dd>
        </div>
        <div>
          <dt>تاريخ الصرف</dt>
          <dd>{formatAccountingDate(advance.issueDate, '—')}</dd>
        </div>
        <div>
          <dt>الاستحقاق</dt>
          <dd>{formatAccountingDate(advance.dueDate, '—')}</dd>
        </div>
      </dl>
      <div>
        <span className="muted">الغرض</span>
        <p>{advance.purpose}</p>
      </div>
      <div className="advance-details__actions">
        <button
          type="button"
          className="advance-primary"
          onClick={onExpense}
          disabled={advance.remaining <= 0}
        >
          <ReceiptText size={17} /> تسجيل مصروف
        </button>
        <button
          type="button"
          className="advance-secondary"
          onClick={onReturn}
          disabled={advance.remaining <= 0}
        >
          <RotateCcw size={17} /> رد المبلغ المتبقي
        </button>
      </div>
      <p className="muted">كل حركة تُرحّل محاسبيًا وتُحدّث رصيد العهدة تلقائيًا.</p>

      <AdvanceTransactionHistory
        transactions={history.transactions}
        page={history.page}
        totalPages={history.totalPages}
        totalCount={history.totalCount}
        onPreviousPage={history.onPreviousPage}
        onNextPage={history.onNextPage}
        isLoading={history.isLoading}
        error={history.error}
      />
    </aside>
  )
}

export function AdvancesPage() {
  const [dialog, setDialog] = useState<'create' | 'expense' | 'return' | null>(null)

  const advances = useAdvances()
  const selected = advances.selectedAdvance
  const history = useAdvanceTransactions(advances.selectedAdvanceId)

  const handleFiltersChange = (key: keyof typeof advances.filters, value: string) => {
    advances.onFiltersChange({ ...advances.filters, [key]: value })
  }

  return (
    <main className="advances-page">
      <header className="advances-header">
        <div>
          <span className="advances-eyebrow">العمليات المالية</span>
          <h1>إدارة العُهد والسلف</h1>
          <p>متابعة الصرف والمصروفات والتسويات من مكان واحد.</p>
        </div>
        <button type="button" className="advance-primary" onClick={() => setDialog('create')}>
          <Plus size={18} /> صرف عهدة جديدة
        </button>
      </header>
      <div className="advances-notice">الصرف والمصروفات ورد المتبقي متصلون بدورة القيود المحاسبية.</div>
      {advances.error && (
        <div className="advances-error" role="alert">
          {advances.error}
        </div>
      )}
      <section className="advance-metrics">
        <article>
          <HandCoins />
          <span>العُهد المفتوحة</span>
          <strong>{advances.summary.openCount}</strong>
          <small>عهدة قيد المتابعة</small>
        </article>
        <article>
          <ReceiptText />
          <span>إجمالي المصروف</span>
          <strong>{formatMoney(advances.summary.totalSpent)}</strong>
          <small>من العُهد المسجلة</small>
        </article>
        <article>
          <WalletCards />
          <span>إجمالي المتبقي</span>
          <strong>{formatMoney(advances.summary.totalRemaining)}</strong>
          <small>قيد التسوية</small>
        </article>
        <article className="is-danger">
          <AlertTriangle />
          <span>عُهد متأخرة</span>
          <strong>{advances.summary.overdueCount}</strong>
          <small>تحتاج متابعة</small>
        </article>
      </section>
      <div className="advances-workspace">
        <section className="advances-list">
          <div className="advances-filters">
            <input
              aria-label="البحث في العهد"
              value={advances.filters.search}
              onChange={(e) => handleFiltersChange('search', e.target.value)}
              placeholder="ابحث بصاحب العهدة..."
            />
            <select
              aria-label="الحالة"
              value={advances.filters.status}
              onChange={(e) => handleFiltersChange('status', e.target.value as AdvanceFilters['status'])}
            >
              <option value="all">جميع الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="overdue">متأخرة</option>
              <option value="settled">تمت التسوية</option>
            </select>
            <select
              aria-label="المشروع"
              value={advances.filters.project}
              onChange={(e) => handleFiltersChange('project', e.target.value)}
            >
              <option value="all">جميع المشاريع</option>
              {advances.projects.map((project) => (
                <option key={project}>{project}</option>
              ))}
            </select>
            <input
              aria-label="من تاريخ"
              type="date"
              value={advances.filters.dateFrom}
              onChange={(e) => handleFiltersChange('dateFrom', e.target.value)}
            />
            <input
              aria-label="إلى تاريخ"
              type="date"
              value={advances.filters.dateTo}
              onChange={(e) => handleFiltersChange('dateTo', e.target.value)}
            />
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
                {advances.data?.filteredAdvances.map((advance) => (
                  <tr
                    key={advance.id}
                    className={selected?.id === advance.id ? 'is-selected' : ''}
                    onClick={() => advances.selectAdvance(advance.id)}
                  >
                    <td>
                      <strong>{advance.holderName}</strong>
                      <small>{advance.holderTitle}</small>
                    </td>
                    <td>{advance.projectNames.join('، ')}</td>
                    <td>{formatAccountingDate(advance.issueDate, '—')}</td>
                    <td>{formatMoney(advance.amount)}</td>
                    <td>{formatMoney(advance.spent)}</td>
                    <td>{formatMoney(advance.remaining)}</td>
                    <td>
                      <span className={`advance-status advance-status--${advance.status}`}>
                        {labels[advance.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {!advances.isLoading && advances.data?.filteredAdvances.length === 0 && (
                  <tr>
                    <td colSpan={7} className="advances-empty">
                      لا توجد عُهد مطابقة للبحث.
                    </td>
                  </tr>
                )}
                {advances.isLoading && (
                  <tr>
                    <td colSpan={7} className="advances-empty">
                      جاري تحميل العُهد...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {advances.totalPages > 1 && (
            <div className="advances-pagination">
              <button
                type="button"
                onClick={advances.onPreviousPage}
                disabled={advances.page <= 1}
                aria-label="الصفحة السابقة"
              >
                → السابق
              </button>
              <span>
                صفحة {advances.page.toLocaleString('ar-EG')} من {advances.totalPages.toLocaleString('ar-EG')}
              </span>
              <button
                type="button"
                onClick={advances.onNextPage}
                disabled={advances.page >= advances.totalPages}
                aria-label="الصفحة التالية"
              >
                التالي ←
              </button>
            </div>
          )}
        </section>
        {selected ? (
          <Details
            advance={selected}
            onExpense={() => setDialog('expense')}
            onReturn={() => setDialog('return')}
            history={history}
          />
        ) : (
          <aside className="advance-details advance-details--empty">
            <HandCoins size={32} />
            <p>اختر عهدة لعرض تفاصيلها.</p>
          </aside>
        )}
      </div>
      {dialog === 'create' && (
        <CreateAdvanceDialog
          options={advances.options}
          optionsError={advances.optionsError}
          optionsLoading={advances.isOptionsLoading}
          saving={advances.isSaving}
          error={advances.actionError}
          onClose={() => setDialog(null)}
          onSave={advances.createAdvance}
        />
      )}
      {selected && dialog === 'expense' && (
        <AdvanceMovementDialog
          mode="expense"
          advance={selected}
          options={advances.options}
          optionsError={advances.optionsError}
          optionsLoading={advances.isOptionsLoading}
          saving={advances.isSaving}
          error={advances.actionError}
          onClose={() => setDialog(null)}
          onExpense={(input) => advances.recordExpense({ input, remaining: selected.remaining })}
          onReturn={(input) => advances.returnAmount({ input, remaining: selected.remaining })}
        />
      )}
      {selected && dialog === 'return' && (
        <AdvanceMovementDialog
          mode="return"
          advance={selected}
          options={advances.options}
          optionsError={advances.optionsError}
          optionsLoading={advances.isOptionsLoading}
          saving={advances.isSaving}
          error={advances.actionError}
          onClose={() => setDialog(null)}
          onExpense={(input) => advances.recordExpense({ input, remaining: selected.remaining })}
          onReturn={(input) => advances.returnAmount({ input, remaining: selected.remaining })}
        />
      )}
    </main>
  )
}

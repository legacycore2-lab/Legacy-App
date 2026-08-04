import { Search } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { JournalAnalyticsFilters, JournalAnalyticsViewModel } from '../types'

type Props = {
  viewModel: JournalAnalyticsViewModel
  filters: JournalAnalyticsFilters
  projectOptions: { id: string; name: string }[]
  onFiltersChange: (f: JournalAnalyticsFilters) => void
}

export function JournalAnalyticsPanel({ viewModel, filters, projectOptions, onFiltersChange }: Props) {
  const set = <K extends keyof JournalAnalyticsFilters>(key: K, value: JournalAnalyticsFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value })

  const { rows, totals, contractors, paymentMethods } = viewModel

  return (
    <div className="an-panel">
      <h3 className="an-panel__title">تحليل القيود اليومية</h3>

      {/* filters */}
      <div className="an-journal-filters">
        <label className="an-journal-filters__search">
          <Search size={16} />
          <input
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            placeholder="بحث في القيود..."
          />
        </label>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => set('dateFrom', e.target.value)}
          title="من تاريخ"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => set('dateTo', e.target.value)}
          title="إلى تاريخ"
        />

        <select value={filters.projectId} onChange={(e) => set('projectId', e.target.value)}>
          <option value="">كل المشاريع</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={filters.entryType}
          onChange={(e) => set('entryType', e.target.value as JournalAnalyticsFilters['entryType'])}
        >
          <option value="all">كل الأنواع</option>
          <option value="income">إيراد</option>
          <option value="expense">مصروف</option>
        </select>

        <select value={filters.contractor} onChange={(e) => set('contractor', e.target.value)}>
          <option value="">كل المقاولين</option>
          {contractors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={filters.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
          <option value="">كل طرق الدفع</option>
          {paymentMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* totals bar */}
      <div className="an-journal-totals">
        <span>
          إجمالي القيود: <strong>{totals.count}</strong>
        </span>
        <span>
          إيرادات: <strong className="is-positive">{formatMoneyInteger(totals.totalIncome)}</strong>
        </span>
        <span>
          مصروفات: <strong className="is-negative">{formatMoneyInteger(totals.totalExpense)}</strong>
        </span>
        <span>
          الصافي:{' '}
          <strong className={totals.netProfit >= 0 ? 'is-positive' : 'is-negative'}>
            {formatMoneyInteger(totals.netProfit)}
          </strong>
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="an-empty">لا توجد قيود تطابق الفلاتر الحالية.</p>
      ) : (
        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>#</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>المشروع</th>
                <th>الفئة</th>
                <th>الوصف</th>
                <th>المقاول</th>
                <th>طريقة الدفع</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.entryNumber || '—'}</td>
                  <td>{row.date}</td>
                  <td>
                    <span className={`an-badge is-${row.type}`}>
                      {row.type === 'income' ? 'إيراد' : row.type === 'expense' ? 'مصروف' : 'غير محدد'}
                    </span>
                  </td>
                  <td>{row.projectName}</td>
                  <td>{row.category}</td>
                  <td>{row.description}</td>
                  <td>{row.contractor}</td>
                  <td>{row.paymentMethod}</td>
                  <td
                    className={
                      row.type === 'income' ? 'is-positive' : row.type === 'expense' ? 'is-negative' : ''
                    }
                  >
                    {formatMoneyInteger(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

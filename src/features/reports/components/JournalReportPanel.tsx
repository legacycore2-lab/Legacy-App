import { Search, X } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import { useJournalReport } from '../hooks/useJournalReport'

const typeLabel: Record<string, string> = {
  income: 'إيراد',
  expense: 'مصروف',
  unknown: 'غير محدد',
}

// prettier-ignore
export function JournalReportPanel() {
  const {
    rows,
    summary,
    filters,
    setFilter,
    resetFilters,
    contractors,
    paymentMethods,
    isLoading,
    error,
  } = useJournalReport()

  const hasFilter =
    filters.query ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.projectId ||
    filters.entryType !== 'all' ||
    filters.contractor ||
    filters.paymentMethod

  return (
    <section className="reports-panel reports-journal-panel">
      <div className="reports-panel__heading">
        <div>
          <span>قيود اليومية</span>
          <h2>تقرير القيود</h2>
        </div>
        {hasFilter ? (
          <button type="button" className="reports-reset-btn" onClick={resetFilters}>
            <X size={15} /> إعادة ضبط
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="reports-journal-filters">
        <label className="reports-search reports-search--inline">
          <Search size={16} />
          <input
            value={filters.query}
            onChange={(e) => setFilter('query', e.target.value)}
            placeholder="بحث في الوصف أو المقاول..."
          />
        </label>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          title="من تاريخ"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          title="إلى تاريخ"
        />

        <select
          value={filters.entryType}
          onChange={(e) => setFilter('entryType', e.target.value as 'all' | 'income' | 'expense')}
        >
          <option value="all">كل الأنواع</option>
          <option value="income">إيرادات</option>
          <option value="expense">مصروفات</option>
        </select>

        {contractors.length > 0 && (
          <select
            value={filters.contractor}
            onChange={(e) => setFilter('contractor', e.target.value)}
          >
            <option value="">كل المقاولين</option>
            {contractors.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {paymentMethods.length > 0 && (
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilter('paymentMethod', e.target.value)}
          >
            <option value="">كل طرق الدفع</option>
            {paymentMethods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {/* Summary strip */}
      <div className="reports-journal-summary">
        <span>إيرادات: <strong className="is-positive">{formatMoneyInteger(summary.totalIncome)}</strong></span>
        <span>مصروفات: <strong className="is-negative">{formatMoneyInteger(summary.totalExpense)}</strong></span>
        <span>الصافي: <strong className={summary.netProfit >= 0 ? 'is-positive' : 'is-negative'}>{formatMoneyInteger(summary.netProfit)}</strong></span>
        <span className="reports-journal-count">{summary.entryCount} قيد</span>
      </div>

      {error ? <div className="reports-state is-error">{error}</div> : null}

      {isLoading ? (
        <div className="reports-state">جارٍ تحميل القيود...</div>
      ) : rows.length === 0 ? (
        <div className="reports-state">لا توجد قيود مطابقة للفلاتر.</div>
      ) : (
        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>المشروع</th>
                <th>المقاول</th>
                <th>طريقة الدفع</th>
                <th>الوصف</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>
                    <span className={`reports-status is-${row.type}`}>
                      {typeLabel[row.type] ?? row.type}
                    </span>
                  </td>
                  <td>{row.projectName}</td>
                  <td>{row.contractor}</td>
                  <td>{row.paymentMethod}</td>
                  <td className="reports-td-desc">{row.description}</td>
                  <td className={row.type === 'income' ? 'is-positive' : row.type === 'expense' ? 'is-negative' : ''}>
                    {formatMoneyInteger(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

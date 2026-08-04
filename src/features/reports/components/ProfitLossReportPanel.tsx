import { RotateCcw } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ProfitLossFilters, ProfitLossViewModel } from '../types/profit-loss.types'

type Props = {
  data: ProfitLossViewModel
  filters: ProfitLossFilters
  hasActiveFilter: boolean
  isFetching: boolean
  onSetFilter: <K extends keyof ProfitLossFilters>(
    key: K,
    value: ProfitLossFilters[K],
  ) => void
  onReset: () => void
}

function formatMargin(value: number | null): string {
  return value === null ? '—' : `${value}%`
}

export function ProfitLossReportPanel({
  data,
  filters,
  hasActiveFilter,
  isFetching,
  onSetFilter,
  onReset,
}: Props) {
  const { summary } = data

  return (
    <section className="pl-report" aria-busy={isFetching}>
      <header className="pl-report__header">
        <div>
          <span className="reports-label">التقارير المالية</span>
          <h2>الأرباح والخسائر</h2>
          <p>تحليل الإيرادات والمصروفات وصافي الأداء حسب الفترة والمشروع.</p>
        </div>
      </header>

      <div className="pl-filters" aria-label="فلاتر تقرير الأرباح والخسائر">
        <label>
          <span>من تاريخ</span>
          <input
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(event) => onSetFilter('dateFrom', event.target.value)}
          />
        </label>
        <label>
          <span>إلى تاريخ</span>
          <input
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(event) => onSetFilter('dateTo', event.target.value)}
          />
        </label>
        <label>
          <span>المشروع</span>
          <select
            value={filters.projectId}
            onChange={(event) => onSetFilter('projectId', event.target.value)}
          >
            <option value="">كل المشاريع</option>
            {data.projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="pl-reset"
          onClick={onReset}
          disabled={!hasActiveFilter}
        >
          <RotateCcw size={16} aria-hidden />
          إعادة الضبط
        </button>
      </div>

      <div className="pl-kpis">
        <article>
          <span>إجمالي الإيرادات</span>
          <strong className="is-income">{formatMoneyInteger(summary.totalIncome)}</strong>
        </article>
        <article>
          <span>إجمالي المصروفات</span>
          <strong className="is-expense">{formatMoneyInteger(summary.totalExpense)}</strong>
        </article>
        <article>
          <span>صافي الربح / الخسارة</span>
          <strong className={summary.netProfit >= 0 ? 'is-income' : 'is-expense'}>
            {formatMoneyInteger(summary.netProfit)}
          </strong>
        </article>
        <article>
          <span>هامش الربح</span>
          <strong>{formatMargin(summary.profitMarginPercent)}</strong>
        </article>
        <article>
          <span>المشاريع ذات الحركة</span>
          <strong>{summary.projectCount}</strong>
        </article>
        <article>
          <span>عدد القيود</span>
          <strong>{summary.entryCount}</strong>
        </article>
      </div>

      <div className="pl-highlights">
        <article>
          <span>أعلى مشروع ربحًا</span>
          <strong>{data.topProfitProject?.projectName ?? 'لا يوجد'}</strong>
          <small>
            {data.topProfitProject ? formatMoneyInteger(data.topProfitProject.net) : '—'}
          </small>
        </article>
        <article>
          <span>أعلى مشروع خسارة</span>
          <strong>{data.topLossProject?.projectName ?? 'لا يوجد'}</strong>
          <small>
            {data.topLossProject ? formatMoneyInteger(data.topLossProject.net) : '—'}
          </small>
        </article>
      </div>

      <section className="reports-panel pl-table-panel">
        <div className="reports-panel__heading">
          <div>
            <span className="reports-label">حسب المشروع</span>
            <h2>تفاصيل الربحية</h2>
          </div>
        </div>
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>المشروع</th>
                <th>قيمة العقد</th>
                <th>الإيرادات</th>
                <th>المصروفات</th>
                <th>الصافي</th>
                <th>الهامش</th>
                <th>القيود</th>
              </tr>
            </thead>
            <tbody>
              {data.projectRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pl-empty-cell">
                    لا توجد بيانات مطابقة للفلاتر الحالية.
                  </td>
                </tr>
              ) : (
                data.projectRows.map((row) => (
                  <tr key={row.projectId}>
                    <td>{row.projectName}</td>
                    <td>{formatMoneyInteger(row.contractValue)}</td>
                    <td>{formatMoneyInteger(row.income)}</td>
                    <td>{formatMoneyInteger(row.expense)}</td>
                    <td className={row.net >= 0 ? 'is-income' : 'is-expense'}>
                      {formatMoneyInteger(row.net)}
                    </td>
                    <td>{formatMargin(row.marginPercent)}</td>
                    <td>{row.entryCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-panel pl-table-panel">
        <div className="reports-panel__heading">
          <div>
            <span className="reports-label">الاتجاه الشهري</span>
            <h2>الأداء حسب الشهر</h2>
          </div>
        </div>
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>الشهر</th>
                <th>الإيرادات</th>
                <th>المصروفات</th>
                <th>الصافي</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pl-empty-cell">
                    لا توجد حركة شهرية للفترة المحددة.
                  </td>
                </tr>
              ) : (
                data.monthlyRows.map((row) => (
                  <tr key={row.monthKey}>
                    <td>{row.monthLabel}</td>
                    <td>{formatMoneyInteger(row.income)}</td>
                    <td>{formatMoneyInteger(row.expense)}</td>
                    <td className={row.net >= 0 ? 'is-income' : 'is-expense'}>
                      {formatMoneyInteger(row.net)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { ProjectFinanceViewModel } from '../types/project.types'

type Props = {
  financeViewModel: ProjectFinanceViewModel
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})

function Currency({ value }: { value: number }) {
  return (
    <bdi dir="ltr" className="project-command__currency">
      {money.format(value)}
    </bdi>
  )
}

export function WorkspaceFinanceTab({ financeViewModel }: Props) {
  const { summary, monthlyCashflow, donutSegments, donutGradient, profitMargin, remaining, contractValue } =
    financeViewModel

  const hasActivity = monthlyCashflow.some((b) => b.incomeAmount > 0 || b.expenseAmount > 0)

  return (
    <div className="project-workspace__finance-tab">
      {/* ── Summary KPIs ── */}
      <div className="project-workspace__finance-kpis">
        <article className="project-workspace__finance-kpi is-contract">
          <span className="project-workspace__finance-kpi__icon">
            <CircleDollarSign size={20} />
          </span>
          <div>
            <small>قيمة العقد</small>
            <strong>
              <Currency value={contractValue} />
            </strong>
          </div>
        </article>

        <article className="project-workspace__finance-kpi is-income">
          <span className="project-workspace__finance-kpi__icon">
            <TrendingUp size={20} />
          </span>
          <div>
            <small>إجمالي الإيرادات</small>
            <strong>
              <Currency value={summary.totalIncome} />
            </strong>
          </div>
        </article>

        <article className="project-workspace__finance-kpi is-expense">
          <span className="project-workspace__finance-kpi__icon">
            <TrendingDown size={20} />
          </span>
          <div>
            <small>إجمالي المصروفات</small>
            <strong>
              <Currency value={summary.totalExpense} />
            </strong>
          </div>
        </article>

        <article className="project-workspace__finance-kpi is-balance">
          <span className="project-workspace__finance-kpi__icon">
            <Wallet size={20} />
          </span>
          <div>
            <small>صافي الربح</small>
            <strong>
              <Currency value={summary.balance} />
            </strong>
            <em>{profitMargin}% هامش الربح</em>
          </div>
        </article>

        <article className="project-workspace__finance-kpi is-remaining">
          <span className="project-workspace__finance-kpi__icon">
            <Scale size={20} />
          </span>
          <div>
            <small>المتبقي من العقد</small>
            <strong>
              <Currency value={remaining} />
            </strong>
          </div>
        </article>
      </div>

      <div className="project-workspace__finance-grid">
        {/* ── Monthly cashflow chart ── */}
        <article className="project-command__panel project-workspace__cashflow">
          <div className="project-command__panel-heading">
            <div>
              <span>التدفق الشهري</span>
              <h2>الإيرادات والمصروفات — آخر 7 أشهر</h2>
            </div>
            <strong>{new Date().getFullYear()}</strong>
          </div>
          <div className="project-workspace__chart-legend">
            <span className="is-income">إيرادات</span>
            <span className="is-expense">مصروفات</span>
          </div>
          {!hasActivity ? (
            <div className="project-command__empty">لا توجد حركة مالية مسجلة في الأشهر السبعة الماضية.</div>
          ) : (
            <div className="project-workspace__bars" aria-label="التدفق المالي الشهري">
              {monthlyCashflow.map((bar) => (
                <div
                  key={bar.label}
                  title={`${bar.label}\nإيرادات: ${money.format(bar.incomeAmount)}\nمصروفات: ${money.format(bar.expenseAmount)}`}
                >
                  <i
                    style={{ height: `${Math.max(4, bar.incomeHeight)}%` }}
                    aria-label={`إيرادات ${bar.label}: ${money.format(bar.incomeAmount)}`}
                  />
                  <b
                    style={{ height: `${Math.max(4, bar.expenseHeight)}%` }}
                    aria-label={`مصروفات ${bar.label}: ${money.format(bar.expenseAmount)}`}
                  />
                  <span>{bar.label.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* ── Expense distribution donut ── */}
        <article className="project-command__panel project-workspace__distribution">
          <div className="project-command__panel-heading">
            <div>
              <span>تحليل التكاليف</span>
              <h2>توزيع المصروفات</h2>
            </div>
            <BarChart3 size={20} />
          </div>
          <div className="project-workspace__donut" style={{ background: donutGradient }}>
            <span>
              <Currency value={summary.totalExpense} />
            </span>
          </div>
          <div className="project-workspace__legend-list">
            {donutSegments.length === 0 ? (
              <p>لا توجد مصروفات مصنفة بعد.</p>
            ) : (
              donutSegments.map((seg) => (
                <div key={seg.label}>
                  <i style={{ background: seg.cssVar }} />
                  <span>{seg.label}</span>
                  <strong>{seg.percentage}%</strong>
                </div>
              ))
            )}
          </div>
        </article>

        {/* ── Income vs Expense flow ── */}
        <article className="project-command__panel project-workspace__finance-flow">
          <div className="project-command__panel-heading">
            <div>
              <span>مقارنة</span>
              <h2>الإيرادات مقابل المصروفات</h2>
            </div>
          </div>
          <div className="project-workspace__finance-flow-bars">
            <div className="project-workspace__finance-flow-row">
              <span className="project-workspace__finance-flow-label">
                <ArrowDownLeft size={14} /> إيرادات
              </span>
              <div className="project-workspace__finance-flow-track">
                <div
                  className="project-workspace__finance-flow-fill is-income"
                  style={{
                    width:
                      summary.totalIncome + summary.totalExpense > 0
                        ? `${(summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100}%`
                        : '0%',
                  }}
                />
              </div>
              <strong>
                <Currency value={summary.totalIncome} />
              </strong>
            </div>
            <div className="project-workspace__finance-flow-row">
              <span className="project-workspace__finance-flow-label">
                <ArrowUpRight size={14} /> مصروفات
              </span>
              <div className="project-workspace__finance-flow-track">
                <div
                  className="project-workspace__finance-flow-fill is-expense"
                  style={{
                    width:
                      summary.totalIncome + summary.totalExpense > 0
                        ? `${(summary.totalExpense / (summary.totalIncome + summary.totalExpense)) * 100}%`
                        : '0%',
                  }}
                />
              </div>
              <strong>
                <Currency value={summary.totalExpense} />
              </strong>
            </div>
          </div>
          <div className="project-workspace__finance-flow-footer">
            <span>عدد القيود</span>
            <strong>{summary.entryCount} قيد</strong>
          </div>
        </article>
      </div>
    </div>
  )
}

import type { CashFlowPoint } from '../types/cash-banks.types'

export function CashBanksFlow({ points }: { points: CashFlowPoint[] }) {
  return (
    <article className="cash-banks-panel cash-banks-flow">
      <div className="cash-banks-panel__header">
        <div>
          <span>نظرة تحليلية</span>
          <h2>التدفقات النقدية</h2>
        </div>
        <small>آخر 6 أشهر</small>
      </div>
      <div className="cash-banks-chart">
        <div className="cash-banks-chart__legend">
          <span>
            <i className="income" /> إيرادات
          </span>
          <span>
            <i className="expense" /> مصروفات
          </span>
        </div>
        <svg viewBox="0 0 720 260" role="img" aria-label="التدفقات النقدية">
          <path
            className="chart-grid"
            d="M40 30H700M40 85H700M40 140H700M40 195H700M40 245H700"
          />
          <path
            className="chart-income-area"
            d="M40 205 C95 185 125 125 175 130 S255 90 305 108 S390 120 440 88 S535 105 590 82 S650 35 700 28 L700 245 L40 245 Z"
          />
          <path
            className="chart-income"
            d="M40 205 C95 185 125 125 175 130 S255 90 305 108 S390 120 440 88 S535 105 590 82 S650 35 700 28"
          />
          <path
            className="chart-expense"
            d="M40 225 C95 210 125 178 175 188 S255 160 305 168 S390 175 440 155 S535 170 590 158 S650 118 700 130"
          />
        </svg>
        <div className="cash-banks-chart__months">
          {points.map((point) => (
            <span key={point.month}>{point.month}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { JournalSummary } from '../types/report.types'

type Props = { summary: JournalSummary }

export function JournalSummaryBar({ summary }: Props) {
  return (
    <div className="jsb">
      <div className="jsb__card jsb__card--income">
        <TrendingUp size={16} aria-hidden="true" />
        <div>
          <span className="jsb__label">إجمالي الإيرادات</span>
          <strong className="jsb__value is-positive">{formatMoneyInteger(summary.totalIncome)}</strong>
        </div>
      </div>
      <div className="jsb__card jsb__card--expense">
        <TrendingDown size={16} aria-hidden="true" />
        <div>
          <span className="jsb__label">إجمالي المصروفات</span>
          <strong className="jsb__value is-negative">{formatMoneyInteger(summary.totalExpense)}</strong>
        </div>
      </div>
      <div className="jsb__card jsb__card--net">
        <div>
          <span className="jsb__label">صافي الحركة</span>
          <strong className={`jsb__value ${summary.netProfit >= 0 ? 'is-positive' : 'is-negative'}`}>
            {formatMoneyInteger(summary.netProfit)}
          </strong>
        </div>
      </div>
      <div className="jsb__card jsb__card--count">
        <div>
          <span className="jsb__label">عدد القيود</span>
          <strong className="jsb__value">{summary.entryCount}</strong>
        </div>
      </div>
    </div>
  )
}

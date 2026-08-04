import { formatMoneyInteger } from '../../../shared/formatters'
import type { JournalSummary } from '../types/report.types'

type Props = {
  summary: JournalSummary
}

export function JournalSummaryBar({ summary }: Props) {
  return (
    <div className="reports-journal-summary">
      <span>
        إيرادات: <strong className="is-positive">{formatMoneyInteger(summary.totalIncome)}</strong>
      </span>
      <span>
        مصروفات: <strong className="is-negative">{formatMoneyInteger(summary.totalExpense)}</strong>
      </span>
      <span>
        الصافي:{' '}
        <strong className={summary.netProfit >= 0 ? 'is-positive' : 'is-negative'}>
          {formatMoneyInteger(summary.netProfit)}
        </strong>
      </span>
      <span className="reports-journal-count">{summary.entryCount} قيد</span>
    </div>
  )
}

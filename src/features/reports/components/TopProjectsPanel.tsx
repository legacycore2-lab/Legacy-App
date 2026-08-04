import { formatMoneyInteger } from '../../../shared/formatters'
import type { ReportProjectRow } from '../types/report.types'

type Props = { rows: ReportProjectRow[] }

export function TopProjectsPanel({ rows }: Props) {
  const active = rows.filter((r) => !r.isArchived && r.entryCount > 0)

  const topProfit = [...active].sort((a, b) => b.net - a.net).slice(0, 5)
  const topLoss = [...active]
    .sort((a, b) => a.net - b.net)
    .filter((r) => r.net < 0)
    .slice(0, 5)

  return (
    <div className="reports-top-panels">
      <section className="reports-panel reports-top-panel">
        <div className="reports-panel__heading">
          <div>
            <span>أعلى ربحية</span>
            <h2>أفضل المشاريع</h2>
          </div>
        </div>
        {topProfit.length === 0 ? (
          <p className="reports-state">لا توجد بيانات.</p>
        ) : (
          <ol className="reports-top-list">
            {topProfit.map((r, i) => (
              <li key={r.id}>
                <span className="reports-top-rank">{i + 1}</span>
                <span className="reports-top-name">{r.name}</span>
                <span className="is-positive">{formatMoneyInteger(r.net)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {topLoss.length > 0 && (
        <section className="reports-panel reports-top-panel">
          <div className="reports-panel__heading">
            <div>
              <span>أعلى خسارة</span>
              <h2>المشاريع الخاسرة</h2>
            </div>
          </div>
          <ol className="reports-top-list">
            {topLoss.map((r, i) => (
              <li key={r.id}>
                <span className="reports-top-rank">{i + 1}</span>
                <span className="reports-top-name">{r.name}</span>
                <span className="is-negative">{formatMoneyInteger(r.net)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

import { Award } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { TopProjectsResult } from '../types/report.types'

// Bar widths are display-only rank-based percentages (not financial calculations).
// 1st place = 100%, 2nd = 75%, 3rd = 55%, 4th = 40%, 5th = 28%
const RANK_BAR_WIDTHS = [100, 75, 55, 40, 28]

type Props = {
  topProjects: TopProjectsResult
}

export function ExecutiveDashboard({ topProjects }: Props) {
  const { profitable, lossMaking } = topProjects

  if (profitable.length === 0 && lossMaking.length === 0) {
    return null
  }

  return (
    <div className="exec-dashboard">
      {profitable.length > 0 && (
        <section className="reports-panel exec-list-panel">
          <div className="reports-panel__heading">
            <div>
              <span className="reports-label">أعلى ربحية</span>
              <h2>أفضل المشاريع</h2>
            </div>
            <Award size={18} className="exec-panel-icon" aria-hidden="true" />
          </div>
          <ol className="exec-list">
            {profitable.map((row, i) => (
              <li key={row.id} className="exec-list__item">
                <span className="exec-rank">{i + 1}</span>
                <div className="exec-list__info">
                  <span className="exec-list__name">{row.name}</span>
                  <div className="exec-bar-wrap">
                    <div className="exec-bar is-profit" style={{ width: `${RANK_BAR_WIDTHS[i] ?? 20}%` }} />
                  </div>
                </div>
                <span className="exec-list__val is-positive">{formatMoneyInteger(row.net)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {lossMaking.length > 0 && (
        <section className="reports-panel exec-list-panel">
          <div className="reports-panel__heading">
            <div>
              <span className="reports-label">تحتاج مراجعة</span>
              <h2>المشاريع الخاسرة</h2>
            </div>
          </div>
          <ol className="exec-list">
            {lossMaking.map((row, i) => (
              <li key={row.id} className="exec-list__item">
                <span className="exec-rank is-loss">{i + 1}</span>
                <div className="exec-list__info">
                  <span className="exec-list__name">{row.name}</span>
                  <div className="exec-bar-wrap">
                    <div className="exec-bar is-loss" style={{ width: `${RANK_BAR_WIDTHS[i] ?? 20}%` }} />
                  </div>
                </div>
                <span className="exec-list__val is-negative">{formatMoneyInteger(row.net)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

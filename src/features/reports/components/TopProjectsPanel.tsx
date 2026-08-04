import { formatMoneyInteger } from '../../../shared/formatters'
import type { TopProjectsResult } from '../types/report.types'

type Props = {
  topProjects: TopProjectsResult
}

export function TopProjectsPanel({ topProjects }: Props) {
  const { profitable, lossMaking } = topProjects

  if (profitable.length === 0 && lossMaking.length === 0) {
    return null
  }

  return (
    <div className="reports-top-grid">
      {profitable.length > 0 && (
        <section className="reports-panel reports-top-panel">
          <div className="reports-panel__heading">
            <div>
              <span className="reports-label">أعلى ربحية</span>
              <h2>أفضل المشاريع</h2>
            </div>
          </div>
          <ol className="reports-top-list">
            {profitable.map((row, i) => (
              <li key={row.id} className="reports-top-item">
                <span className="reports-top-rank">{i + 1}</span>
                <span className="reports-top-name">{row.name}</span>
                <div className="reports-top-bar-wrap">
                  <div
                    className="reports-top-bar is-profit"
                    style={{
                      width: `${Math.min(100, (row.net / (profitable[0]?.net || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="is-positive">{formatMoneyInteger(row.net)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {lossMaking.length > 0 && (
        <section className="reports-panel reports-top-panel">
          <div className="reports-panel__heading">
            <div>
              <span className="reports-label">تحتاج مراجعة</span>
              <h2>المشاريع الخاسرة</h2>
            </div>
          </div>
          <ol className="reports-top-list">
            {lossMaking.map((row, i) => (
              <li key={row.id} className="reports-top-item">
                <span className="reports-top-rank is-loss">{i + 1}</span>
                <span className="reports-top-name">{row.name}</span>
                <div className="reports-top-bar-wrap">
                  <div
                    className="reports-top-bar is-loss"
                    style={{
                      width: `${Math.min(100, (Math.abs(row.net) / (Math.abs(lossMaking[0]?.net) || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="is-negative">{formatMoneyInteger(row.net)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

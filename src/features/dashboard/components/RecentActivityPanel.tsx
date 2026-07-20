import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import type { DashboardEntry } from '../types/dashboard.types'

export function RecentActivityPanel({ entries }: { entries: DashboardEntry[] }) {
  return (
    <section className="command-panel">
      <header className="command-panel__header">
        <div>
          <span>الحركة المالية</span>
          <h2>آخر النشاط</h2>
        </div>
        <Clock3 size={20} />
      </header>

      <div className="activity-feed">
        {entries.slice(0, 4).map((entry) => {
          const isIncome = entry.type === 'income'

          return (
            <article key={entry.id}>
              <span className={`activity-feed__icon activity-feed__icon--${entry.type}`}>
                {isIncome ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
              </span>
              <div>
                <strong>{entry.description}</strong>
                <span>
                  {entry.project} · {entry.date}
                </span>
              </div>
              <b className={`activity-feed__amount activity-feed__amount--${entry.type}`}>
                {entry.amount}
              </b>
            </article>
          )
        })}
      </div>
    </section>
  )
}

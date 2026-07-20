import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { DashboardEntry } from '../types/dashboard.types'

export function RecentEntries({ entries }: { entries: DashboardEntry[] }) {
  return (
    <article className="dashboard-widget recent-entries">
      <header className="widget-header">
        <div><span>الحركة المالية</span><h2>آخر القيود</h2></div>
        <button type="button">عرض الكل</button>
      </header>

      <div className="entries-list">
        {entries.map((entry) => {
          const income = entry.type === 'income'
          const Icon = income ? ArrowDownLeft : ArrowUpRight
          return (
            <div className="entry-row" key={entry.id}>
              <span className={`entry-icon ${income ? 'income' : 'expense'}`}><Icon size={17} /></span>
              <div className="entry-copy">
                <strong>{entry.description}</strong>
                <small>{entry.project} · {entry.date}</small>
              </div>
              <div className={`entry-amount ${income ? 'income' : 'expense'}`}>
                <strong>{income ? '+' : '-'} {entry.amount}</strong>
                <small>{entry.id}</small>
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

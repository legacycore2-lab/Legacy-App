import { AlertCircle, ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DashboardEntry } from '../types/dashboard.types'

export function RecentEntries({ entries }: { entries: DashboardEntry[] }) {
  const navigate = useNavigate()

  return (
    <article className="dashboard-widget recent-entries">
      <header className="widget-header">
        <div>
          <span>الحركة المالية</span>
          <h2>آخر القيود</h2>
        </div>
        <button type="button" onClick={() => navigate('/journal')}>
          عرض الكل
        </button>
      </header>

      <div className="entries-list">
        {entries.length === 0 ? (
          <div className="widget-empty-state">
            <ReceiptText size={32} />
            <p>لا توجد قيود مسجلة حالياً</p>
          </div>
        ) : (
          entries.map((entry) => {
            const income = entry.type === 'income'
            const expense = entry.type === 'expense'
            const Icon = income ? ArrowDownLeft : expense ? ArrowUpRight : AlertCircle
            const colorClass = income ? 'income' : expense ? 'expense' : 'unknown'
            return (
              <div className="entry-row" key={entry.id}>
                <span className={`entry-icon ${colorClass}`}>
                  <Icon size={17} aria-label={income ? 'إيراد' : expense ? 'مصروف' : 'نوع غير معروف'} />
                </span>
                <div className="entry-copy">
                  <strong>{entry.description}</strong>
                  <small>
                    {entry.project} · {entry.date}
                  </small>
                </div>
                <div className={`entry-amount ${colorClass}`}>
                  <strong>
                    {income ? '+' : expense ? '-' : ''} {entry.amount}
                  </strong>
                  <small>{entry.id}</small>
                </div>
              </div>
            )
          })
        )}
      </div>
    </article>
  )
}

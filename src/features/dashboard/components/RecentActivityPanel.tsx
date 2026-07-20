import { ArrowDownLeft, ArrowUpRight, Clock3, ReceiptText } from 'lucide-react'
import type { DashboardEntry } from '../types/dashboard.types'
import { PanelEmptyState } from './PanelEmptyState'

function toDisplayReference(id: string): string {
  return id.startsWith('#') ? id : 'قيد مالي'
}

export function RecentActivityPanel({ entries }: { entries: DashboardEntry[] }) {
  const recentEntries = entries.slice(0, 4)

  return (
    <section className="command-panel command-panel--activity">
      <header className="command-panel__header">
        <div>
          <span>الحركة المالية</span>
          <h2>آخر النشاط</h2>
        </div>
        <span className="command-panel__header-icon" aria-hidden="true">
          <Clock3 size={19} />
        </span>
      </header>

      {recentEntries.length ? (
        <ol className="activity-timeline" aria-label="أحدث الحركات المالية">
          {recentEntries.map((entry) => {
            const isIncome = entry.type === 'income'
            const ActivityIcon = isIncome ? ArrowDownLeft : ArrowUpRight

            return (
              <li key={entry.id} className="activity-timeline__item">
                <span className={`activity-timeline__marker activity-timeline__marker--${entry.type}`}>
                  <ActivityIcon size={17} aria-hidden="true" />
                </span>

                <article className="activity-timeline__content">
                  <div className="activity-timeline__topline">
                    <strong>{entry.description}</strong>
                    <b className={`activity-timeline__amount activity-timeline__amount--${entry.type}`}>
                      {isIncome ? '+' : '-'} {entry.amount}
                    </b>
                  </div>

                  <span className="activity-timeline__meta">
                    <b>{entry.project}</b>
                    <span>{entry.date}</span>
                    <span>{toDisplayReference(entry.id)}</span>
                  </span>
                </article>
              </li>
            )
          })}
        </ol>
      ) : (
        <PanelEmptyState
          icon={ReceiptText}
          title="لا توجد حركة مالية حديثة"
          description="ستظهر أحدث القيود هنا فور تسجيل أول حركة مالية."
        />
      )}
    </section>
  )
}

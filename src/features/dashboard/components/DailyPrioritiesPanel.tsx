import { BellRing } from 'lucide-react'
import type { DashboardAlert } from '../types/dashboard.types'
import { PanelEmptyState } from './PanelEmptyState'

type Props = {
  alerts: DashboardAlert[]
}

export function DailyPrioritiesPanel({ alerts }: Props) {
  return (
    <section className="command-panel command-panel--tasks">
      <header className="command-panel__header">
        <div>
          <span>أولوية اليوم</span>
          <h2>المهام والتنبيهات</h2>
        </div>
        <span className="command-panel__badge">{alerts.length}</span>
      </header>

      {alerts.length ? (
        <div className="task-list">
          {alerts.map((alert) => (
            <article key={alert.id}>
              <span className={`task-dot task-dot--${alert.tone}`} aria-hidden="true" />
              <div>
                <strong>{alert.title}</strong>
                <span>{alert.description}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <PanelEmptyState
          icon={BellRing}
          title="لا توجد تنبيهات حالية"
          description="كل المشاريع والحركات الحالية ضمن الحدود المتوقعة."
        />
      )}
    </section>
  )
}

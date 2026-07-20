import { ArrowUpLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardAction } from '../types/dashboard.types'

export function QuickActions({ actions }: { actions: DashboardAction[] }) {
  return (
    <article className="dashboard-widget quick-actions-widget">
      <header className="widget-header">
        <div>
          <span>وصول أسرع</span>
          <h2>إجراءات سريعة</h2>
        </div>
      </header>

      <nav className="quick-actions-grid" aria-label="إجراءات لوحة التحكم السريعة">
        {actions.map(({ label, description, path, icon: Icon }) => (
          <Link className="quick-action" key={path} to={path}>
            <span className="quick-action__icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <strong>{label}</strong>
            <small>{description}</small>
            <ArrowUpLeft className="quick-action__arrow" size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </article>
  )
}

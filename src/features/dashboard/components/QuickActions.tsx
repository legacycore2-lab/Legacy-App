import { dashboardActions } from '../data/dashboard.mock'

export function QuickActions() {
  return (
    <article className="dashboard-widget quick-actions-widget">
      <header className="widget-header">
        <div><span>وصول أسرع</span><h2>إجراءات سريعة</h2></div>
      </header>

      <div className="quick-actions-grid">
        {dashboardActions.map(({ label, description, icon: Icon }) => (
          <button type="button" className="quick-action" key={label}>
            <span><Icon size={20} /></span>
            <strong>{label}</strong>
            <small>{description}</small>
          </button>
        ))}
      </div>
    </article>
  )
}

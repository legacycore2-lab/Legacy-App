import type { DashboardKpi } from '../types/dashboard.types'

type KpiCardProps = DashboardKpi

export function KpiCard({ label, value, trend, icon: Icon, tone }: KpiCardProps) {
  const trendClassName = trend.startsWith('-') ? 'negative' : 'positive'

  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${tone}`}>
        <Icon size={22} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>ج.م</small>
      </div>

      <em className={trendClassName}>{trend}</em>
    </article>
  )
}

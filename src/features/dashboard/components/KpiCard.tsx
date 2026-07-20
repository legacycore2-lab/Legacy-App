import type { DashboardKpi } from '../types/dashboard.types'

type KpiCardProps = DashboardKpi

export function KpiCard({ label, value, trend, icon: Icon, tone }: KpiCardProps) {
  const trendClassName = trend.startsWith('-') ? 'negative' : 'positive'

  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__topline">
        <div className={`kpi-icon ${tone}`} aria-hidden="true">
          <Icon size={21} />
        </div>
        <em className={trendClassName}>{trend}</em>
      </div>

      <div className="kpi-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

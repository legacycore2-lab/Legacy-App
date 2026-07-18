import { dashboardKpis } from '../data/dashboard.mock'
import { KpiCard } from './KpiCard'

export function KpiGrid() {
  return (
    <div className="kpi-grid">
      {dashboardKpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}

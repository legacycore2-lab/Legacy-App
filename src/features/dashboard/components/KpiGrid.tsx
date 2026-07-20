import type { DashboardKpi } from '../types/dashboard.types'
import { KpiCard } from './KpiCard'

export function KpiGrid({ kpis }: { kpis: DashboardKpi[] }) {
  return (
    <div className="kpi-grid">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}

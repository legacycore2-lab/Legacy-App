import { AlertTriangle, Clock3, FolderKanban, WalletCards } from 'lucide-react'
import type { DashboardAlert, DashboardKpi, DashboardProject } from '../types/dashboard.types'

type DashboardHeaderProps = {
  projects: DashboardProject[]
  alerts: DashboardAlert[]
  kpis: DashboardKpi[]
}

function findKpiValue(kpis: DashboardKpi[], label: string): string {
  return kpis.find((kpi) => kpi.label === label)?.value ?? '—'
}

export function DashboardHeader({ projects, alerts, kpis }: DashboardHeaderProps) {
  const summaryItems = [
    {
      label: 'مشاريع نشطة',
      value: String(projects.length),
      icon: FolderKanban,
      tone: 'green',
    },
    {
      label: 'تنبيهات تحتاج مراجعة',
      value: String(alerts.length),
      icon: AlertTriangle,
      tone: 'gold',
    },
    {
      label: 'إجمالي الرصيد',
      value: findKpiValue(kpis, 'إجمالي الرصيد'),
      icon: WalletCards,
      tone: 'green',
    },
    { label: 'آخر تحديث', value: 'الآن', icon: Clock3, tone: 'neutral' },
  ]

  return (
    <section className="dashboard-header" aria-labelledby="dashboard-heading">
      <div className="dashboard-header__intro">
        <span>مركز قيادة Legacy Core</span>
        <h1 id="dashboard-heading">
          صباح الخير، محمود <span aria-hidden="true">👋</span>
        </h1>
        <p>نظرة تشغيلية مباشرة على السيولة والمشاريع والحركة المالية والتنبيهات المهمة.</p>
      </div>

      <div className="dashboard-header__summary">
        {summaryItems.map(({ label, value, icon: Icon, tone }) => (
          <article className="dashboard-summary-card" key={label}>
            <span className={`dashboard-summary-card__icon ${tone}`} aria-hidden="true">
              <Icon size={18} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

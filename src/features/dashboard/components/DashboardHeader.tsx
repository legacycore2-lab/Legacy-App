import { AlertTriangle, Clock3, FolderKanban, WalletCards } from 'lucide-react'
import type { DashboardHeaderSummary } from '../types/dashboard.types'

type DashboardHeaderProps = {
  summary: DashboardHeaderSummary
}

export function DashboardHeader({ summary }: DashboardHeaderProps) {
  const summaryItems = [
    { label: 'مشاريع نشطة', value: summary.activeProjects, icon: FolderKanban, tone: 'green' },
    { label: 'تنبيهات تحتاج مراجعة', value: summary.alerts, icon: AlertTriangle, tone: 'gold' },
    { label: 'الرصيد الحالي', value: summary.balance, icon: WalletCards, tone: 'green' },
    { label: 'آخر تحديث', value: summary.lastUpdated, icon: Clock3, tone: 'neutral' },
  ]

  return (
    <section className="dashboard-header" aria-labelledby="dashboard-heading">
      <div className="dashboard-header__intro">
        <span>ملخص التشغيل</span>
        <h1 id="dashboard-heading">صباح الخير، محمود 👋</h1>
        <p>تابع أهم الأرقام والتنبيهات وحركة المشاريع من مكان واحد.</p>
      </div>

      <div className="dashboard-header__summary">
        {summaryItems.map(({ label, value, icon: Icon, tone }) => (
          <article className="dashboard-summary-card" key={label}>
            <span className={`dashboard-summary-card__icon ${tone}`}>
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

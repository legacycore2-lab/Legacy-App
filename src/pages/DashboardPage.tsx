import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, WalletCards } from 'lucide-react'
import { QuickActions } from '../features/dashboard/components/QuickActions'
import { RecentEntries } from '../features/dashboard/components/RecentEntries'
import { RecentProjects } from '../features/dashboard/components/RecentProjects'
import '../features/dashboard/dashboard.css'

const kpis = [
  { label: 'إجمالي الرصيد', value: '2,458,750', trend: '+12.5%', icon: WalletCards, tone: 'green' },
  { label: 'إجمالي الإيرادات', value: '3,215,000', trend: '+18.7%', icon: ArrowDownLeft, tone: 'green' },
  { label: 'إجمالي المصروفات', value: '756,250', trend: '-4.3%', icon: ArrowUpRight, tone: 'gold' },
  { label: 'إجمالي العهد', value: '485,000', trend: '+6.2%', icon: BriefcaseBusiness, tone: 'green' },
]

export function DashboardPage() {
  return (
    <section className="dashboard-details">
      <div className="welcome-panel">
        <span className="welcome-kicker">ملخص اليوم</span>
        <h1>Mahmoud</h1>
        <p>تابع حركة المشاريع والحسابات وآخر القيود من مكان واحد.</p>
      </div>

      <div className="kpi-grid">
        {kpis.map(({ label, value, trend, icon: Icon, tone }) => (
          <article className="kpi-card" key={label}>
            <div className={`kpi-icon ${tone}`}><Icon size={22} /></div>
            <div><span>{label}</span><strong>{value}</strong><small>ج.م</small></div>
            <em className={trend.startsWith('-') ? 'negative' : 'positive'}>{trend}</em>
          </article>
        ))}
      </div>

      <div className="dashboard-details-grid">
        <RecentProjects />
        <div className="dashboard-side-stack">
          <RecentEntries />
          <QuickActions />
        </div>
      </div>
    </section>
  )
}

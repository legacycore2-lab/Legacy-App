import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, WalletCards } from 'lucide-react'

const kpis = [
  { label: 'إجمالي الرصيد', value: '2,458,750', trend: '+12.5%', icon: WalletCards, tone: 'green' },
  { label: 'إجمالي الإيرادات', value: '3,215,000', trend: '+18.7%', icon: ArrowDownLeft, tone: 'green' },
  { label: 'إجمالي المصروفات', value: '756,250', trend: '-4.3%', icon: ArrowUpRight, tone: 'gold' },
  { label: 'إجمالي العهد', value: '485,000', trend: '+6.2%', icon: BriefcaseBusiness, tone: 'green' },
]

export function DashboardPage() {
  return (
    <section className="dashboard-preview">
      <div className="welcome-panel">
        <span className="welcome-kicker">مرحبًا بعودتك</span>
        <h1>Mahmoud</h1>
        <p>الهيكل الخارجي أصبح جاهزًا، ونبدأ بعد موافقتك في تفاصيل الداشبورد.</p>
      </div>

      <div className="kpi-grid">
        {kpis.map(({ label, value, trend, icon: Icon, tone }) => (
          <article className="kpi-card" key={label}>
            <div className={`kpi-icon ${tone}`}><Icon size={22} /></div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>ج.م</small>
            </div>
            <em className={trend.startsWith('-') ? 'negative' : 'positive'}>{trend}</em>
          </article>
        ))}
      </div>

      <div className="shell-status-grid">
        <article className="status-card">
          <span>المرحلة الحالية</span>
          <h2>App Shell</h2>
          <p>Sidebar + Topbar + Responsive + Theme System</p>
        </article>
        <article className="status-card accent-card">
          <span>الخطوة التالية</span>
          <h2>Dashboard Details</h2>
          <p>المشاريع، آخر القيود، التنبيهات، وحالات الحسابات.</p>
        </article>
      </div>
    </section>
  )
}

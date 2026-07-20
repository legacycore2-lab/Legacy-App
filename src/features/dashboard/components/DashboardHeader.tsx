import { AlertTriangle, Clock3, FolderKanban, WalletCards } from 'lucide-react'

const summaryItems = [
  { label: 'مشاريع نشطة', value: '5', icon: FolderKanban, tone: 'green' },
  { label: 'تنبيهات تحتاج مراجعة', value: '3', icon: AlertTriangle, tone: 'gold' },
  { label: 'رصيد اليوم', value: '2,458,750', icon: WalletCards, tone: 'green' },
  { label: 'آخر تحديث', value: 'الآن', icon: Clock3, tone: 'neutral' },
]

export function DashboardHeader() {
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

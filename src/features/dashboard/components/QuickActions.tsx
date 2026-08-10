import { Banknote, BriefcaseBusiness, FolderPlus, ReceiptText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type QuickActionItem = {
  label: string
  description: string
  icon: typeof FolderPlus
  route?: string
  disabledReason?: string
}

const quickActions: QuickActionItem[] = [
  { label: 'إضافة مشروع', description: 'إنشاء مشروع جديد', icon: FolderPlus, route: '/projects' },
  { label: 'إضافة قيد', description: 'دخل أو مصروف', icon: ReceiptText, route: '/journal' },
  { label: 'تسجيل عهدة', description: 'إنشاء عهدة جديدة', icon: BriefcaseBusiness, route: '/advances' },
  { label: 'تحويل مالي', description: 'بين الخزنة والبنوك', icon: Banknote, route: '/banks' },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <article className="dashboard-widget quick-actions-widget">
      <header className="widget-header">
        <div>
          <span>وصول أسرع</span>
          <h2>إجراءات سريعة</h2>
        </div>
      </header>

      <div className="quick-actions-grid">
        {quickActions.map(({ label, description, icon: Icon, route, disabledReason }) => {
          const isDisabled = !route

          return (
            <button
              key={label}
              type="button"
              className={`quick-action${isDisabled ? ' quick-action--disabled' : ''}`}
              onClick={route ? () => navigate(route) : undefined}
              disabled={isDisabled}
              title={disabledReason}
              aria-label={isDisabled ? `${label} — ${disabledReason}` : label}
            >
              <span>
                <Icon size={20} />
              </span>
              <strong>{label}</strong>
              <small>{description}</small>
              {isDisabled && <em className="quick-action__soon">قريباً</em>}
            </button>
          )
        })}
      </div>
    </article>
  )
}

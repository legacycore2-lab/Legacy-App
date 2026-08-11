import { Banknote, BriefcaseBusiness, FolderPlus, ReceiptText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardPermissions } from '../hooks/useDashboardPermissions'

type QuickActionItem = {
  key: 'project' | 'journal' | 'advance' | 'transfer'
  label: string
  description: string
  icon: typeof FolderPlus
  route: string
}

const quickActions: QuickActionItem[] = [
  { key: 'project', label: 'إضافة مشروع', description: 'إنشاء مشروع جديد', icon: FolderPlus, route: '/projects' },
  { key: 'journal', label: 'إضافة قيد', description: 'دخل أو مصروف', icon: ReceiptText, route: '/journal' },
  { key: 'advance', label: 'تسجيل عهدة', description: 'إنشاء عهدة جديدة', icon: BriefcaseBusiness, route: '/advances' },
  { key: 'transfer', label: 'تحويل مالي', description: 'بين الخزنة والبنوك', icon: Banknote, route: '/banks' },
]

export function QuickActions() {
  const navigate = useNavigate()
  const permissions = useDashboardPermissions()
  const permissionByAction = {
    project: permissions.canCreateProject,
    journal: permissions.canCreateJournalEntry,
    advance: permissions.canCreateAdvance,
    transfer: permissions.canTransferFunds,
  } as const

  return (
    <article className="dashboard-widget quick-actions-widget">
      <header className="widget-header">
        <div>
          <span>وصول أسرع</span>
          <h2>إجراءات سريعة</h2>
        </div>
      </header>

      <div className="quick-actions-grid">
        {quickActions.map(({ key, label, description, icon: Icon, route }) => {
          const isDisabled = !permissionByAction[key]
          const disabledReason = isDisabled ? 'ليس لديك صلاحية لتنفيذ هذا الإجراء.' : undefined

          return (
            <button
              key={key}
              type="button"
              className={`quick-action${isDisabled ? ' quick-action--disabled' : ''}`}
              onClick={isDisabled ? undefined : () => navigate(route)}
              disabled={isDisabled}
              title={disabledReason}
              aria-label={isDisabled ? `${label} — ${disabledReason}` : label}
            >
              <span>
                <Icon size={20} />
              </span>
              <strong>{label}</strong>
              <small>{description}</small>
              {isDisabled && <em className="quick-action__soon">قراءة فقط</em>}
            </button>
          )
        })}
      </div>
    </article>
  )
}

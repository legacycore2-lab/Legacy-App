import { useState } from 'react'
import { formatTimestamp } from '../../../shared/date-utils'
import type { EffectivePermission, ManagedUser, UserAdministrationDetails } from '../types/users.types'

type Tab = 'information' | 'permissions' | 'projects' | 'activity'

type Props = {
  user: ManagedUser
  details?: UserAdministrationDetails
  permissions: EffectivePermission[]
  isLoading: boolean
  isSaving: boolean
  onEdit: () => void
  onStatusChange: () => Promise<unknown>
  onProjectsSave: (projectIds: string[]) => Promise<unknown>
  onPasswordChange: (password: string) => Promise<unknown>
}

const roleLabels = { super_admin: 'مدير عام', admin: 'مدير', accountant: 'محاسب', viewer: 'مشاهد' }
const activityLabels = {
  user_created: 'إنشاء الحساب',
  user_updated: 'تعديل البيانات',
  status_changed: 'تغيير حالة الحساب',
  password_reset: 'تغيير كلمة المرور',
  projects_updated: 'تحديث المشاريع',
}

export function UserAdministrationPanel(props: Props) {
  const [tab, setTab] = useState<Tab>('information')

  async function changePassword() {
    const password = window.prompt('أدخل كلمة مرور مؤقتة جديدة (10 أحرف تشمل حرفًا ورقمًا ورمزًا)')
    if (password) await props.onPasswordChange(password)
  }

  return (
    <>
      <div className="users-drawer__tabs">
        {(['information', 'permissions', 'projects', 'activity'] as Tab[]).map((value, index) => (
          <button key={value} className={tab === value ? 'is-active' : ''} onClick={() => setTab(value)}>
            {['المعلومات', 'الصلاحيات', 'المشاريع', 'النشاط'][index]}
          </button>
        ))}
      </div>

      {tab === 'information' && (
        <>
          <div className="users-detail-card">
            <h3>المعلومات الأساسية</h3>
            <Row label="الاسم الكامل" value={props.user.displayName} />
            <Row label="البريد الإلكتروني" value={props.user.email} />
            <Row label="رقم الجوال" value={props.user.phone ?? 'غير مسجل'} />
            <Row label="تاريخ الإنشاء" value={formatTimestamp(props.user.createdAt)} />
            <Row label="آخر تسجيل دخول" value={formatTimestamp(props.user.lastLoginAt, '—')} />
            <Row label="الدور" value={roleLabels[props.user.role]} />
          </div>
          <div className="users-detail-card users-account-actions">
            <h3>إجراءات الحساب</h3>
            <button type="button" onClick={props.onEdit}>
              تعديل البيانات
            </button>
            <button type="button" disabled={props.isSaving} onClick={() => void changePassword()}>
              تغيير كلمة المرور
            </button>
            <button
              type="button"
              disabled={props.isSaving}
              className="is-danger"
              onClick={() => void props.onStatusChange()}
            >
              {props.user.status === 'active' ? 'إيقاف المستخدم' : 'تفعيل المستخدم'}
            </button>
          </div>
        </>
      )}

      {tab === 'permissions' && (
        <div className="users-detail-card">
          <h3>الصلاحيات الفعلية حسب الدور</h3>
          {props.permissions.map((permission) => (
            <Row
              key={permission.label}
              label={permission.label}
              value={permission.allowed ? 'مسموح' : 'غير مسموح'}
            />
          ))}
        </div>
      )}

      {tab === 'projects' &&
        (props.isLoading || !props.details ? (
          <div className="users-detail-card">جارٍ التحميل...</div>
        ) : (
          <ProjectsEditor
            key={props.details.projects
              .filter((project) => project.assigned)
              .map((project) => project.id)
              .join(',')}
            projects={props.details.projects}
            isSaving={props.isSaving}
            onSave={props.onProjectsSave}
          />
        ))}

      {tab === 'activity' && (
        <div className="users-detail-card users-activity">
          <h3>سجل النشاط الإداري</h3>
          {props.isLoading ? (
            <p>جارٍ التحميل...</p>
          ) : props.details?.activity.length ? (
            props.details.activity.map((item) => (
              <div key={item.id}>
                <strong>{activityLabels[item.action]}</strong>
                <span>{formatTimestamp(item.created_at)}</span>
              </div>
            ))
          ) : (
            <p>لا يوجد نشاط مسجل بعد.</p>
          )}
        </div>
      )}
    </>
  )
}

function ProjectsEditor({
  projects,
  isSaving,
  onSave,
}: {
  projects: UserAdministrationDetails['projects']
  isSaving: boolean
  onSave: (projectIds: string[]) => Promise<unknown>
}) {
  const [projectIds, setProjectIds] = useState(() =>
    projects.filter((project) => project.assigned).map((project) => project.id),
  )
  return (
    <div className="users-detail-card users-project-access">
      <h3>المشاريع المسندة</h3>
      {projects.map((project) => (
        <label key={project.id}>
          <input
            type="checkbox"
            checked={projectIds.includes(project.id)}
            onChange={(event) =>
              setProjectIds((current) =>
                event.target.checked ? [...current, project.id] : current.filter((id) => id !== project.id),
              )
            }
          />
          {project.name}
        </label>
      ))}
      <button className="users-primary-button" disabled={isSaving} onClick={() => void onSave(projectIds)}>
        حفظ المشاريع
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="users-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

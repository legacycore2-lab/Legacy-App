import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import type { UserRole } from '../types/users.types'
import './users-page.css'

const roleLabels: Record<UserRole, string> = {
  super_admin: 'مدير عام',
  admin: 'مدير',
  accountant: 'محاسب',
  viewer: 'مشاهد',
}

export function UsersPage() {
  const {
    filters,
    setFilters,
    users,
    summary,
    selectedUser,
    selectUser,
    closeUserDetails,
    isLoading,
    isError,
    refetch,
  } = useUsers()

  return (
    <section className="users-page" dir="rtl">
      <header className="users-page__heading">
        <div>
          <span className="users-page__eyebrow">الإعدادات / إدارة الوصول</span>
          <h1>إدارة المستخدمين</h1>
          <p>إدارة الحسابات والأدوار والوصول للمشاريع من مكان واحد.</p>
        </div>
        <button
          className="users-primary-button"
          type="button"
          disabled
          title="يتطلب ربط إدارة المستخدمين بالخلفية أولاً"
        >
          <Plus size={18} /> إضافة مستخدم
        </button>
      </header>

      <div className="users-preview-note">
        معاينة واجهة فقط — لا يتم إنشاء أو تعديل أي مستخدم حقيقي في هذه المرحلة.
      </div>

      <div className="users-kpis">
        <Kpi icon={<Users size={20} />} label="إجمالي المستخدمين" value={summary.total} tone="violet" />
        <Kpi
          icon={<UserRoundCheck size={20} />}
          label="المستخدمون النشطون"
          value={summary.active}
          tone="green"
        />
        <Kpi icon={<ShieldCheck size={20} />} label="المدراء" value={summary.admins} tone="blue" />
        <Kpi icon={<UserRoundX size={20} />} label="الموقوفون" value={summary.suspended} tone="red" />
      </div>

      <div className="users-workspace">
        <div className="users-main-card">
          <div className="users-toolbar">
            <label className="users-search">
              <Search size={18} />
              <input
                value={filters.query}
                onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              />
            </label>
            <select
              value={filters.role}
              onChange={(event) =>
                setFilters({ ...filters, role: event.target.value as typeof filters.role })
              }
              aria-label="فلتر الدور"
            >
              <option value="all">جميع الأدوار</option>
              <option value="super_admin">مدير عام</option>
              <option value="admin">مدير</option>
              <option value="accountant">محاسب</option>
              <option value="viewer">مشاهد</option>
            </select>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters({ ...filters, status: event.target.value as typeof filters.status })
              }
              aria-label="فلتر الحالة"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>

          {isError ? (
            <div className="users-state">
              تعذر تحميل المستخدمين. <button onClick={() => void refetch()}>إعادة المحاولة</button>
            </div>
          ) : isLoading ? (
            <div className="users-state">جارٍ تحميل المستخدمين...</div>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الدور</th>
                    <th>الحالة</th>
                    <th>آخر دخول</th>
                    <th>تاريخ الإنشاء</th>
                    <th>المشاريع</th>
                    <th aria-label="الإجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <button className="users-person" type="button" onClick={() => selectUser(user.id)}>
                          <span className="users-avatar">{user.displayName.slice(0, 1)}</span>
                          <span>
                            <strong>{user.displayName}</strong>
                            <small>{user.email.split('@')[0]}</small>
                          </span>
                        </button>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`users-role users-role--${user.role}`}>{roleLabels[user.role]}</span>
                      </td>
                      <td>
                        <span className={`users-status users-status--${user.status}`}>
                          {user.status === 'active' ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td>{user.lastLoginAt ?? '—'}</td>
                      <td>{user.createdAt}</td>
                      <td>{user.projectCount === 0 ? 'كل المشاريع' : `${user.projectCount} مشروع`}</td>
                      <td>
                        <div className="users-actions">
                          <button type="button" onClick={() => selectUser(user.id)} aria-label="عرض التفاصيل">
                            <Eye size={16} />
                          </button>
                          <button type="button" disabled aria-label="تعديل المستخدم">
                            <Pencil size={16} />
                          </button>
                          <button type="button" disabled aria-label="المزيد">
                            <MoreHorizontal size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={8} className="users-empty">
                        لا توجد نتائج مطابقة للفلاتر الحالية.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedUser && (
          <aside className="users-drawer" aria-label="تفاصيل المستخدم">
            <div className="users-drawer__head">
              <div>
                <span className="users-avatar users-avatar--large">
                  {selectedUser.displayName.slice(0, 1)}
                </span>
                <div>
                  <h2>{selectedUser.displayName}</h2>
                  <span className={`users-status users-status--${selectedUser.status}`}>
                    {selectedUser.status === 'active' ? 'نشط' : 'موقوف'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={closeUserDetails} aria-label="إغلاق">
                ×
              </button>
            </div>
            <div className="users-drawer__tabs">
              <button className="is-active">المعلومات</button>
              <button disabled>الصلاحيات</button>
              <button disabled>المشاريع</button>
              <button disabled>النشاط</button>
            </div>
            <div className="users-detail-card">
              <h3>المعلومات الأساسية</h3>
              <Detail label="الاسم الكامل" value={selectedUser.displayName} />
              <Detail label="البريد الإلكتروني" value={selectedUser.email} />
              <Detail label="رقم الجوال" value={selectedUser.phone ?? 'غير مسجل'} />
              <Detail label="تاريخ الإنشاء" value={selectedUser.createdAt} />
              <Detail label="آخر تسجيل دخول" value={selectedUser.lastLoginAt ?? '—'} />
              <Detail label="الدور" value={roleLabels[selectedUser.role]} />
            </div>
            <div className="users-detail-card users-account-actions">
              <h3>إجراءات الحساب</h3>
              <button type="button" disabled>
                تعديل البيانات
              </button>
              <button type="button" disabled>
                إعادة تعيين كلمة المرور
              </button>
              <button type="button" disabled className="is-danger">
                {selectedUser.status === 'active' ? 'إيقاف المستخدم' : 'تفعيل المستخدم'}
              </button>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: string
}) {
  return (
    <article className="users-kpi">
      <span className={`users-kpi__icon users-kpi__icon--${tone}`}>{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="users-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

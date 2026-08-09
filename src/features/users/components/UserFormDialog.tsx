import { useState, type FormEvent } from 'react'
import type { CreateUserInput, ManagedUser, UpdateUserInput, UserRole } from '../types/users.types'

type Props = {
  user?: ManagedUser
  isSaving: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (input: CreateUserInput | UpdateUserInput) => Promise<void>
}

export function UserFormDialog({ user, isSaving, error, onClose, onSubmit }: Props) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'viewer')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (user) await onSubmit({ id: user.id, displayName, phone, role })
    else await onSubmit({ displayName, email, password, phone, role })
  }

  return (
    <div
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-label={user ? 'تعديل المستخدم' : 'إضافة مستخدم'}
    >
      <form className="users-modal__card" onSubmit={(event) => void submit(event)}>
        <header>
          <h2>{user ? 'تعديل المستخدم' : 'إضافة مستخدم'}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </header>
        <label>
          الاسم الكامل
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        </label>
        {!user && (
          <>
            <label>
              البريد الإلكتروني
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              كلمة المرور المؤقتة
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          </>
        )}
        <label>
          رقم الجوال
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          الدور
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="super_admin">مدير عام</option>
            <option value="admin">مدير</option>
            <option value="accountant">محاسب</option>
            <option value="viewer">مشاهد</option>
          </select>
        </label>
        {error && (
          <p className="users-modal__error" role="alert">
            {error.message}
          </p>
        )}
        <footer>
          <button type="button" onClick={onClose}>
            إلغاء
          </button>
          <button className="users-primary-button" disabled={isSaving}>
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </footer>
      </form>
    </div>
  )
}

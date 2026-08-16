import { accountTypes } from '../data/account-options'
import { useAccountForm } from '../hooks/useAccountForm'
import type { Account, AccountInput } from '../types/accounts.types'

type Props = {
  allAccounts: Account[]
  editing: Account | null
  isSaving: boolean
  onSave: (input: AccountInput) => Promise<void>
  onCancel: () => void
}

export function AccountForm({ allAccounts, editing, isSaving, onSave, onCancel }: Props) {
  const form = useAccountForm({ allAccounts, editing, onSave, onCancel })

  return (
    <form className="account-form" onSubmit={form.submit}>
      <div className="account-form-head">
        <span className="accounts-section-kicker">إدارة الحساب</span>
        <h2>{editing ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h2>
        <p>{editing ? 'حدّث بيانات الحساب مع الحفاظ على مكانه الصحيح داخل الشجرة.' : 'أنشئ حسابًا رئيسيًا أو فرعيًا داخل دليل الحسابات.'}</p>
      </div>

      <div className="account-form-section">
        <span className="account-form-section-title">البيانات الأساسية</span>
        <label>
          كود الحساب
          <input
            value={form.value.code}
            onChange={(event) => form.update('code', event.target.value)}
            placeholder="مثال: 1101"
            required
          />
        </label>
        <label>
          الاسم العربي
          <input
            value={form.value.nameAr}
            onChange={(event) => form.update('nameAr', event.target.value)}
            placeholder="اسم الحساب"
            required
          />
        </label>
        <label>
          الاسم الإنجليزي
          <input
            value={form.value.nameEn}
            onChange={(event) => form.update('nameEn', event.target.value)}
            placeholder="اختياري"
          />
        </label>
      </div>

      <div className="account-form-section">
        <span className="account-form-section-title">مكان الحساب في الشجرة</span>
        <label>
          نوع الحساب
          <select
            value={form.value.accountType}
            onChange={(event) => form.updateType(event.target.value as AccountInput['accountType'])}
          >
            {accountTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          الحساب الرئيسي
          <select
            value={form.value.parentId ?? ''}
            onChange={(event) => form.update('parentId', event.target.value || null)}
          >
            <option value="">بدون حساب رئيسي</option>
            {form.parentAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} — {account.nameAr}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="account-form-section account-form-options">
        <span className="account-form-section-title">إعدادات الحساب</span>
        <label className="account-option-card">
          <input
            type="checkbox"
            checked={form.value.isPostable}
            onChange={(event) => form.update('isPostable', event.target.checked)}
          />
          <span>
            <strong>قابل للترحيل</strong>
            <small>يسمح باستخدام الحساب مباشرة في القيود.</small>
          </span>
        </label>
        <label className="account-option-card">
          <input
            type="checkbox"
            checked={form.value.isActive}
            onChange={(event) => form.update('isActive', event.target.checked)}
          />
          <span>
            <strong>حساب نشط</strong>
            <small>يظهر الحساب ضمن الخيارات المتاحة للاستخدام.</small>
          </span>
        </label>
      </div>

      <div className="account-actions">
        <button disabled={isSaving}>{isSaving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الحساب'}</button>
        {editing && (
          <button type="button" className="secondary" onClick={form.cancel} disabled={isSaving}>
            إلغاء
          </button>
        )}
      </div>
    </form>
  )
}

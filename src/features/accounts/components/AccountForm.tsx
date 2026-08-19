import { X } from 'lucide-react'
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
  const isCashBankCreation = !editing && form.value.cashBankKind && form.value.cashBankKind !== 'none'

  return (
    <form className="account-form" onSubmit={form.submit}>
      <div className="account-form-head">
        <button type="button" className="account-form-close" onClick={form.cancel} aria-label="إغلاق">
          <X size={18} aria-hidden="true" />
        </button>
        <span className="accounts-section-kicker">إدارة الحساب</span>
        <h2>{editing ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h2>
        <p>
          {editing
            ? 'حدّث البيانات وسيظل الحساب داخل نفس منطق الشجرة المحاسبية.'
            : 'يمكن إنشاء حساب عادي أو بنك/خزنة؛ البنك والخزنة سيظهران تلقائيًا في شاشة الخزنة والبنوك.'}
        </p>
      </div>

      {!editing && (
        <div className="account-form-section account-form-options">
          <span className="account-form-section-title">استخدام الحساب</span>
          <label>
            نوع الاستخدام
            <select
              value={form.value.cashBankKind ?? 'none'}
              onChange={(event) => form.updateCashBankKind(event.target.value as 'none' | 'cash' | 'bank')}
            >
              <option value="none">حساب أستاذ عادي</option>
              <option value="cash">خزنة</option>
              <option value="bank">بنك</option>
            </select>
            {isCashBankCreation && (
              <small className="account-field-hint">
                سيُربط الحساب تلقائيًا بالخزنة والبنوك برصيد افتتاحي صفر وتحت 1100 — النقدية والبنوك.
              </small>
            )}
          </label>
        </div>
      )}

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
            placeholder={isCashBankCreation ? 'مثال: CIB أو الخزنة الرئيسية' : 'مثال: أسمنت'}
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

      <div className="account-form-section account-tree-placement">
        <span className="account-form-section-title">مكان الحساب في الشجرة</span>
        <label>
          نوع الحساب
          <select
            value={form.value.accountType}
            onChange={(event) => form.updateType(event.target.value as AccountInput['accountType'])}
            disabled={Boolean(isCashBankCreation)}
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
            disabled={Boolean(isCashBankCreation)}
          >
            {editing?.parentId === null && <option value="">حساب رئيسي بدون أب</option>}
            {form.parentAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} — {account.nameAr}
              </option>
            ))}
          </select>
          <small className="account-field-hint">
            {isCashBankCreation
              ? 'البنوك والخزن تُنشأ مباشرة تحت حساب 1100 لضمان الربط الموحد.'
              : 'الحساب الرئيسي يتحدد تلقائيًا حسب النوع، ويمكن اختيار فرع تجميعي أدق من نفس النوع.'}
          </small>
        </label>
      </div>

      <div className="account-form-section account-form-options">
        <span className="account-form-section-title">إعدادات الحساب</span>
        <label className="account-option-card">
          <input
            type="checkbox"
            checked={form.value.isPostable}
            onChange={(event) => form.update('isPostable', event.target.checked)}
            disabled={Boolean(isCashBankCreation)}
          />
          <span>
            <strong>حساب ترحيل</strong>
            <small>يسمح بتسجيل القيود مباشرة على هذا الحساب.</small>
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
            <small>يظهر ضمن الحسابات المتاحة للاستخدام.</small>
          </span>
        </label>
      </div>

      <div className="account-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الحساب'}
        </button>
        <button type="button" className="secondary" onClick={form.cancel} disabled={isSaving}>
          إلغاء
        </button>
      </div>
    </form>
  )
}

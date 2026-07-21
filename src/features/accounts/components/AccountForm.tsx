import { accountTypes } from '../data/account-options'
import { useAccountForm } from '../hooks/useAccountForm'
import type { Account, AccountInput } from '../types/accounts.types'

type Props = {
  accounts: Account[]
  editing: Account | null
  isSaving: boolean
  onSave: (input: AccountInput) => Promise<void>
  onCancel: () => void
}

export function AccountForm({ accounts, editing, isSaving, onSave, onCancel }: Props) {
  const form = useAccountForm({ editing, onSave, onCancel })

  return (
    <form className="account-form" onSubmit={form.submit}>
      <h2>{editing ? 'تعديل الحساب' : 'إضافة حساب'}</h2>
      <label>
        كود الحساب
        <input value={form.value.code} onChange={(event) => form.update('code', event.target.value)} required />
      </label>
      <label>
        الاسم العربي
        <input
          value={form.value.nameAr}
          onChange={(event) => form.update('nameAr', event.target.value)}
          required
        />
      </label>
      <label>
        الاسم الإنجليزي
        <input value={form.value.nameEn} onChange={(event) => form.update('nameEn', event.target.value)} />
      </label>
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
          {accounts
            .filter(
              (account) =>
                account.accountType === form.value.accountType && account.id !== form.value.id,
            )
            .map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} — {account.nameAr}
              </option>
            ))}
        </select>
      </label>
      <div className="account-checks">
        <label>
          <input
            type="checkbox"
            checked={form.value.isPostable}
            onChange={(event) => form.update('isPostable', event.target.checked)}
          />
          قابل للترحيل
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.value.isActive}
            onChange={(event) => form.update('isActive', event.target.checked)}
          />
          نشط
        </label>
      </div>
      <div className="account-actions">
        <button disabled={isSaving}>{isSaving ? 'جارٍ الحفظ...' : 'حفظ الحساب'}</button>
        {editing && (
          <button type="button" className="secondary" onClick={form.cancel} disabled={isSaving}>
            إلغاء
          </button>
        )}
      </div>
    </form>
  )
}

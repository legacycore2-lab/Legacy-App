import { useEffect, useState, type FormEvent } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import '../styles/accounts.css'
import type { AccountInput, AccountType } from '../types/accounts.types'

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'asset', label: 'الأصول' },
  { value: 'liability', label: 'الالتزامات' },
  { value: 'equity', label: 'حقوق الملكية' },
  { value: 'revenue', label: 'الإيرادات' },
  { value: 'expense', label: 'المصروفات' },
]

const emptyForm: AccountInput = {
  code: '',
  nameAr: '',
  nameEn: '',
  accountType: 'asset',
  normalBalance: 'debit',
  parentId: null,
  isPostable: true,
  isActive: true,
}

export function AccountsPage() {
  const vm = useAccounts()
  const [form, setForm] = useState<AccountInput>(emptyForm)

  useEffect(() => {
    if (!vm.editing) {
      setForm(emptyForm)
      return
    }

    const { level: _level, ...account } = vm.editing
    setForm(account)
  }, [vm.editing])

  const setType = (accountType: AccountType) =>
    setForm((current) => ({
      ...current,
      accountType,
      normalBalance: accountType === 'asset' || accountType === 'expense' ? 'debit' : 'credit',
      parentId: null,
    }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await vm.onSave(form)
    setForm(emptyForm)
  }

  return (
    <section className="accounts-page">
      <header className="accounts-header">
        <div>
          <span className="accounts-eyebrow">المحاسبة العامة</span>
          <h1>دليل الحسابات</h1>
          <p>هيكل موحد للحسابات القابلة للترحيل والحسابات التجميعية.</p>
        </div>
        <div className="accounts-total">
          {vm.allAccounts.length}
          <small>حساب</small>
        </div>
      </header>

      {vm.error && <div className="accounts-error">{vm.error}</div>}

      <div className="accounts-grid">
        <form className="account-form" onSubmit={submit}>
          <h2>{vm.editing ? 'تعديل الحساب' : 'إضافة حساب'}</h2>

          <label>
            كود الحساب
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              required
            />
          </label>

          <label>
            الاسم العربي
            <input
              value={form.nameAr}
              onChange={(event) => setForm({ ...form, nameAr: event.target.value })}
              required
            />
          </label>

          <label>
            الاسم الإنجليزي
            <input
              value={form.nameEn}
              onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
            />
          </label>

          <label>
            نوع الحساب
            <select
              value={form.accountType}
              onChange={(event) => setType(event.target.value as AccountType)}
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
              value={form.parentId ?? ''}
              onChange={(event) =>
                setForm({ ...form, parentId: event.target.value || null })
              }
            >
              <option value="">بدون حساب رئيسي</option>
              {vm.allAccounts
                .filter(
                  (account) =>
                    account.accountType === form.accountType && account.id !== form.id,
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
                checked={form.isPostable}
                onChange={(event) =>
                  setForm({ ...form, isPostable: event.target.checked })
                }
              />
              قابل للترحيل
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              نشط
            </label>
          </div>

          <div className="account-actions">
            <button disabled={vm.isSaving}>
              {vm.isSaving ? 'جارٍ الحفظ...' : 'حفظ الحساب'}
            </button>
            {vm.editing && (
              <button type="button" className="secondary" onClick={vm.onCancelEdit}>
                إلغاء
              </button>
            )}
          </div>
        </form>

        <div className="accounts-list-card">
          <div className="accounts-toolbar">
            <input
              placeholder="بحث بالكود أو الاسم"
              value={vm.search}
              onChange={(event) => vm.onSearchChange(event.target.value)}
            />
            <select
              value={vm.type}
              onChange={(event) => vm.onTypeChange(event.target.value as AccountType | 'all')}
            >
              <option value="all">كل الأنواع</option>
              {accountTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="accounts-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الحساب</th>
                  <th>النوع</th>
                  <th>المستوى</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vm.isLoading ? (
                  <tr>
                    <td colSpan={6}>جارٍ التحميل...</td>
                  </tr>
                ) : (
                  vm.accounts.map((account) => (
                    <tr key={account.id} className={!account.isActive ? 'inactive' : ''}>
                      <td>{account.code}</td>
                      <td
                        style={{
                          paddingInlineStart: `${12 + (account.level - 1) * 18}px`,
                        }}
                      >
                        <strong>{account.nameAr}</strong>
                        <small>{account.nameEn}</small>
                      </td>
                      <td>
                        {accountTypes.find((item) => item.value === account.accountType)?.label}
                      </td>
                      <td>{account.level}</td>
                      <td>
                        {account.isActive ? 'نشط' : 'متوقف'} ·{' '}
                        {account.isPostable ? 'ترحيل' : 'تجميعي'}
                      </td>
                      <td>
                        <button onClick={() => vm.onEdit(account)}>تعديل</button>
                        <button onClick={() => vm.onToggle(account.id, !account.isActive)}>
                          {account.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

import { accountTypes, getAccountTypeLabel } from '../data/account-options'
import type { Account, AccountType } from '../types/accounts.types'

type Props = {
  accounts: Account[]
  search: string
  type: AccountType | 'all'
  isLoading: boolean
  onSearchChange: (value: string) => void
  onTypeChange: (value: AccountType | 'all') => void
  onEdit: (account: Account) => void
  onToggle: (id: string, active: boolean) => void
}

export function AccountsList({
  accounts,
  search,
  type,
  isLoading,
  onSearchChange,
  onTypeChange,
  onEdit,
  onToggle,
}: Props) {
  return (
    <section className="accounts-list-card">
      <div className="accounts-list-head">
        <div>
          <span className="accounts-section-kicker">الشجرة المحاسبية</span>
          <h2>الحسابات</h2>
          <p>استعرض الحسابات الرئيسية والفرعية وحالة كل حساب.</p>
        </div>
        <span className="accounts-results-count">{accounts.length} ظاهر</span>
      </div>

      <div className="accounts-toolbar">
        <div className="accounts-search-field">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="البحث في دليل الحسابات"
            placeholder="ابحث بالكود أو اسم الحساب"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search ? (
            <button
              type="button"
              className="accounts-clear-search"
              onClick={() => onSearchChange('')}
            >
              مسح
            </button>
          ) : null}
        </div>

        <select
          aria-label="تصفية حسب نوع الحساب"
          value={type}
          onChange={(event) => onTypeChange(event.target.value as AccountType | 'all')}
        >
          <option value="all">كل أنواع الحسابات</option>
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
              <th>الحساب</th>
              <th>النوع</th>
              <th>التصنيف</th>
              <th>الحالة</th>
              <th aria-label="الإجراءات" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="accounts-empty-state" colSpan={5}>
                  جارٍ تحميل دليل الحسابات...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td className="accounts-empty-state" colSpan={5}>
                  لا توجد حسابات مطابقة للبحث أو الفلتر الحالي.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className={!account.isActive ? 'inactive' : ''}>
                  <td data-label="الحساب">
                    <div
                      className={`account-tree-cell ${account.level === 1 ? 'account-tree-root' : ''}`}
                      style={{ paddingInlineStart: `${Math.max(0, account.level - 1) * 20}px` }}
                    >
                      <span className="account-tree-node" aria-hidden="true" />
                      <div className="account-name-stack">
                        <div className="account-name-line">
                          <strong>{account.nameAr}</strong>
                          <span className="account-code">{account.code}</span>
                        </div>
                        <div className="account-meta-line">
                          {account.nameEn ? <span>{account.nameEn}</span> : null}
                          <span>المستوى {account.level}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-label="النوع">
                    <span className="account-type-badge">
                      {getAccountTypeLabel(account.accountType)}
                    </span>
                  </td>
                  <td data-label="التصنيف">
                    <span
                      className={`account-kind-badge ${account.isPostable ? 'postable' : 'summary'}`}
                    >
                      {account.isPostable ? 'حساب ترحيل' : 'حساب تجميعي'}
                    </span>
                  </td>
                  <td data-label="الحالة">
                    <span
                      className={`account-status-badge ${account.isActive ? 'active' : 'inactive'}`}
                    >
                      <span aria-hidden="true" />
                      {account.isActive ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td className="account-row-actions" data-label="الإجراءات">
                    <button
                      type="button"
                      className="account-action-primary"
                      onClick={() => onEdit(account)}
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      className="account-action-secondary"
                      onClick={() => onToggle(account.id, !account.isActive)}
                    >
                      {account.isActive ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

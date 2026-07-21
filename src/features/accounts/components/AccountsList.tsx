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
    <div className="accounts-list-card">
      <div className="accounts-toolbar">
        <input
          placeholder="بحث بالكود أو الاسم"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <select
          value={type}
          onChange={(event) =>
            onTypeChange(event.target.value as AccountType | 'all')
          }
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
            {isLoading ? (
              <tr>
                <td colSpan={6}>جارٍ التحميل...</td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr
                  key={account.id}
                  className={!account.isActive ? 'inactive' : ''}
                >
                  <td>{account.code}</td>
                  <td
                    style={{
                      paddingInlineStart: `${12 + (account.level - 1) * 18}px`,
                    }}
                  >
                    <strong>{account.nameAr}</strong>
                    <small>{account.nameEn}</small>
                  </td>
                  <td>{getAccountTypeLabel(account.accountType)}</td>
                  <td>{account.level}</td>
                  <td>
                    {account.isActive ? 'نشط' : 'متوقف'} ·{' '}
                    {account.isPostable ? 'ترحيل' : 'تجميعي'}
                  </td>
                  <td>
                    <button type="button" onClick={() => onEdit(account)}>
                      تعديل
                    </button>
                    <button
                      type="button"
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
    </div>
  )
}

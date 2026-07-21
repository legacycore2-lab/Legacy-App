import { AccountForm } from '../components/AccountForm'
import { AccountsList } from '../components/AccountsList'
import { useAccounts } from '../hooks/useAccounts'
import '../styles/accounts.css'

export function AccountsPage() {
  const vm = useAccounts()

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
        <AccountForm
          key={vm.editing?.id ?? 'new-account'}
          accounts={vm.allAccounts}
          editing={vm.editing}
          isSaving={vm.isSaving}
          onSave={vm.onSave}
          onCancel={vm.onCancelEdit}
        />
        <AccountsList
          accounts={vm.accounts}
          search={vm.search}
          type={vm.type}
          isLoading={vm.isLoading}
          onSearchChange={vm.onSearchChange}
          onTypeChange={vm.onTypeChange}
          onEdit={vm.onEdit}
          onToggle={vm.onToggle}
        />
      </div>
    </section>
  )
}

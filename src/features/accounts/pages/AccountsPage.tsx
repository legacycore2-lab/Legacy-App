import { AccountForm } from '../components/AccountForm'
import { AccountsList } from '../components/AccountsList'
import { useAccounts } from '../hooks/useAccounts'
import '../styles/accounts.css'

export function AccountsPage() {
  const vm = useAccounts()

  return (
    <section className="accounts-page">
      <header className="accounts-header">
        <div className="accounts-heading">
          <span className="accounts-eyebrow">المحاسبة العامة</span>
          <h1>دليل الحسابات</h1>
          <p>إدارة الهيكل المحاسبي من الحسابات الرئيسية حتى حسابات الترحيل في شاشة واحدة واضحة.</p>
        </div>
        <div className="accounts-total" aria-label="إجمالي الحسابات">
          <span>{vm.allAccounts.length}</span>
          <small>إجمالي الحسابات</small>
        </div>
      </header>

      <div className="accounts-guide">
        <div>
          <strong>هيكل محاسبي واضح</strong>
          <span>الحسابات التجميعية للفروع، وحسابات الترحيل لتسجيل القيود مباشرة.</span>
        </div>
        <span className="accounts-guide-badge">Chart of Accounts</span>
      </div>

      {vm.error && <div className="accounts-error">{vm.error}</div>}

      <div className="accounts-workspace">
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

        <aside className="accounts-side-panel">
          <AccountForm
            key={vm.editing?.id ?? 'new-account'}
            allAccounts={vm.allAccounts}
            editing={vm.editing}
            isSaving={vm.isSaving}
            onSave={vm.onSave}
            onCancel={vm.onCancelEdit}
          />
        </aside>
      </div>
    </section>
  )
}

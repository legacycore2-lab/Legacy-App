import { Layers3, ListTree, NotebookTabs, WalletCards } from 'lucide-react'
import { AccountForm } from '../components/AccountForm'
import { AccountsList } from '../components/AccountsList'
import { useAccounts } from '../hooks/useAccounts'
import '../styles/accounts.css'

export function AccountsPage() {
  const vm = useAccounts()
  const postingCount = vm.allAccounts.filter((account) => account.isPostable).length
  const summaryCount = vm.allAccounts.length - postingCount
  const typeCount = new Set(vm.allAccounts.map((account) => account.accountType)).size

  return (
    <section className="accounts-page">
      <header className="accounts-header">
        <div className="accounts-heading">
          <span className="accounts-eyebrow">المحاسبة العامة</span>
          <h1>دليل الحسابات</h1>
          <p>شجرة محاسبية منظمة توضح نوع الحساب، تبعيته، ومستوى الترحيل من أول نظرة.</p>
        </div>
      </header>

      <div className="accounts-kpis" aria-label="ملخص دليل الحسابات">
        <article>
          <span className="accounts-kpi-icon">
            <NotebookTabs size={19} aria-hidden="true" />
          </span>
          <div>
            <small>إجمالي الحسابات</small>
            <strong>{vm.allAccounts.length}</strong>
          </div>
        </article>
        <article>
          <span className="accounts-kpi-icon">
            <WalletCards size={19} aria-hidden="true" />
          </span>
          <div>
            <small>حسابات الترحيل</small>
            <strong>{postingCount}</strong>
          </div>
        </article>
        <article>
          <span className="accounts-kpi-icon">
            <Layers3 size={19} aria-hidden="true" />
          </span>
          <div>
            <small>حسابات تجميعية</small>
            <strong>{summaryCount}</strong>
          </div>
        </article>
        <article>
          <span className="accounts-kpi-icon">
            <ListTree size={19} aria-hidden="true" />
          </span>
          <div>
            <small>أنواع الحسابات</small>
            <strong>{typeCount}</strong>
          </div>
        </article>
      </div>

      {vm.error && <div className="accounts-error">{vm.error}</div>}

      <div className="accounts-workspace">
        <AccountsList
          accounts={vm.accounts}
          search={vm.search}
          type={vm.type}
          isLoading={vm.isLoading}
          expandedIds={vm.expandedIds}
          onSearchChange={vm.onSearchChange}
          onTypeChange={vm.onTypeChange}
          onToggleExpanded={vm.onToggleExpanded}
          onCreate={vm.onCreate}
          onEdit={vm.onEdit}
          onToggle={vm.onToggle}
        />
      </div>

      {vm.isEditorOpen && (
        <div className="accounts-editor-layer" role="presentation" onMouseDown={vm.onCancelEdit}>
          <aside
            className="accounts-side-panel"
            aria-label={vm.editing ? 'تعديل الحساب' : 'إضافة حساب جديد'}
            onMouseDown={(event) => event.stopPropagation()}
          >
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
      )}
    </section>
  )
}

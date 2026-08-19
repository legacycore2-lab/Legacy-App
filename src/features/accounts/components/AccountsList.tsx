import { ChevronDown, ChevronLeft, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { accountTypes, getAccountTypeLabel } from '../data/account-options'
import type { Account, AccountCashBankKind, AccountType } from '../types/accounts.types'

type Props = {
  accounts: Account[]
  search: string
  type: AccountType | 'all'
  showDeleted: boolean
  deletedCount: number
  isLoading: boolean
  isDeleting: boolean
  expandedIds: Set<string>
  onSearchChange: (value: string) => void
  onTypeChange: (value: AccountType | 'all') => void
  onShowDeletedChange: (value: boolean) => void
  onToggleExpanded: (id: string) => void
  onCreate: () => void
  onEdit: (account: Account) => void
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => Promise<unknown>
  onRestore: (id: string, cashBankKind?: AccountCashBankKind) => Promise<unknown>
}

type TreeRow = { account: Account; depth: number; hasChildren: boolean; isOrphan: boolean }

function buildTypeTree(accounts: Account[], expandedIds: Set<string>, expandAll: boolean): TreeRow[] {
  const ids = new Set(accounts.map((account) => account.id))
  const children = new Map<string | null, Account[]>()
  accounts.forEach((account) => {
    const parentKey = account.parentId && ids.has(account.parentId) ? account.parentId : null
    const siblings = children.get(parentKey) ?? []
    siblings.push(account)
    children.set(parentKey, siblings)
  })
  children.forEach((siblings) => siblings.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true })))
  const rows: TreeRow[] = []
  const visit = (account: Account, depth: number) => {
    const accountChildren = children.get(account.id) ?? []
    rows.push({ account, depth, hasChildren: accountChildren.length > 0, isOrphan: Boolean(account.parentId && !ids.has(account.parentId)) })
    if (accountChildren.length === 0 || (!expandAll && !expandedIds.has(account.id))) return
    accountChildren.forEach((child) => visit(child, depth + 1))
  }
  ;(children.get(null) ?? []).forEach((root) => visit(root, 0))
  return rows
}

export function AccountsList({ accounts, search, type, showDeleted, deletedCount, isLoading, isDeleting, expandedIds, onSearchChange, onTypeChange, onShowDeletedChange, onToggleExpanded, onCreate, onEdit, onToggle, onDelete, onRestore }: Props) {
  const expandAll = search.trim().length > 0
  const accountById = new Map(accounts.map((account) => [account.id, account]))

  return (
    <section className="accounts-list-card">
      <div className="accounts-list-head">
        <div>
          <span className="accounts-section-kicker">الشجرة المحاسبية</span>
          <h2>هيكل الحسابات</h2>
          <p>كل حساب في مكانه الصحيح حسب النوع والحساب الرئيسي.</p>
        </div>
        <button type="button" className="accounts-create-button" onClick={onCreate}><Plus size={16} aria-hidden="true" />حساب جديد</button>
      </div>

      <div className="accounts-toolbar">
        <div className="accounts-search-field">
          <span aria-hidden="true"><Search size={17} strokeWidth={2} focusable="false" /></span>
          <input aria-label="البحث في دليل الحسابات" placeholder="ابحث بالكود أو اسم الحساب..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
          {search && <button type="button" className="accounts-clear-search" onClick={() => onSearchChange('')}>مسح</button>}
        </div>
        <select aria-label="تصفية حسب نوع الحساب" value={type} onChange={(event) => onTypeChange(event.target.value as AccountType | 'all')}>
          <option value="all">كل أنواع الحسابات</option>
          {accountTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button type="button" className="account-action-secondary" onClick={() => onShowDeletedChange(!showDeleted)}>{showDeleted ? 'إخفاء المحذوفة' : `المحذوفة (${deletedCount})`}</button>
        <span className="accounts-results-count">{accounts.length} حساب</span>
      </div>

      <div className="accounts-tree-head" aria-hidden="true"><span>الحساب</span><span>طبيعة الحساب</span><span>الحالة</span><span>الإجراءات</span></div>
      <div className="accounts-tree" aria-live="polite">
        {isLoading && <div className="accounts-empty-state">جارٍ تحميل دليل الحسابات...</div>}
        {!isLoading && accounts.length === 0 && <div className="accounts-empty-state">لا توجد حسابات مطابقة للبحث أو الفلتر الحالي.</div>}

        {!isLoading && accountTypes.map((group) => {
          if (type !== 'all' && type !== group.value) return null
          const groupAccounts = accounts.filter((account) => account.accountType === group.value)
          if (groupAccounts.length === 0) return null
          const rows = buildTypeTree(groupAccounts, expandedIds, expandAll)
          const postingCount = groupAccounts.filter((account) => account.isPostable && !account.deletedAt).length

          return (
            <section key={group.value} className={`account-type-section type-${group.value}`}>
              <header className="account-type-section-head"><div><span className="account-type-dot" aria-hidden="true" /><strong>{group.label}</strong><small>{groupAccounts.length} حساب</small></div><span>{postingCount} ترحيل</span></header>
              <div className="account-type-tree">
                {rows.map(({ account, depth, hasChildren, isOrphan }) => {
                  const isExpanded = expandAll || expandedIds.has(account.id)
                  const isDeleted = Boolean(account.deletedAt)
                  const parent = account.parentId ? accountById.get(account.parentId) : undefined
                  const legacyCashBankNeedsKind = isDeleted && account.cashBankKind === 'none' && parent?.code === '1100' && account.accountType === 'asset' && account.isPostable
                  const kindClassName = ['account-kind-badge', account.isPostable ? 'postable' : 'summary'].join(' ')

                  return (
                    <article key={account.id} className={`account-tree-row${account.isActive ? '' : ' inactive'}`} style={isDeleted ? { opacity: 0.58 } : undefined}>
                      <div className="account-tree-main" style={{ paddingInlineStart: `${depth * 26 + 12}px` }}>
                        {hasChildren ? <button type="button" className="account-tree-toggle" onClick={() => onToggleExpanded(account.id)} aria-label={isExpanded ? 'إغلاق الفروع' : 'فتح الفروع'} aria-expanded={isExpanded}>{isExpanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}</button> : <span className="account-tree-leaf" aria-hidden="true" />}
                        <div className="account-name-stack">
                          <div className="account-name-line"><strong>{account.nameAr}</strong><span className="account-code">{account.code}</span></div>
                          <div className="account-meta-line">{account.nameEn && <span>{account.nameEn}</span>}<span>المستوى {depth + 1}</span>{isOrphan && <span className="account-data-warning">الرئيسي غير مرتبط</span>}</div>
                        </div>
                      </div>
                      <div className="account-tree-nature"><span className={`account-type-badge type-${account.accountType}`}>{getAccountTypeLabel(account.accountType)}</span><span className={kindClassName}>{account.isPostable ? 'ترحيل' : 'تجميعي'}</span></div>
                      <div className={`account-status-badge ${isDeleted ? 'inactive' : account.isActive ? 'active' : 'inactive'}`}><span aria-hidden="true" />{isDeleted ? 'محذوف' : account.isActive ? 'نشط' : 'متوقف'}</div>
                      <div className="account-row-actions">
                        {isDeleted ? (
                          legacyCashBankNeedsKind ? (
                            <>
                              <button type="button" className="account-action-secondary" disabled={isDeleting} onClick={() => void onRestore(account.id, 'bank')}><RotateCcw size={14} aria-hidden="true" />استعادة كبنك</button>
                              <button type="button" className="account-action-secondary" disabled={isDeleting} onClick={() => void onRestore(account.id, 'cash')}><RotateCcw size={14} aria-hidden="true" />استعادة كخزنة</button>
                            </>
                          ) : (
                            <button type="button" className="account-action-secondary" disabled={isDeleting} onClick={() => void onRestore(account.id)}><RotateCcw size={14} aria-hidden="true" />استعادة</button>
                          )
                        ) : (
                          <>
                            <button type="button" className="account-action-primary" onClick={() => onEdit(account)}>تعديل</button>
                            <button type="button" className="account-action-secondary" onClick={() => onToggle(account.id, !account.isActive)}>{account.isActive ? 'إيقاف' : 'تفعيل'}</button>
                            <button type="button" className="account-action-secondary" disabled={isDeleting} style={{ borderColor: '#b42318', color: '#b42318' }} onClick={() => { if (window.confirm(`حذف الحساب «${account.nameAr}»؟ سيختفي من الاستخدام مع الاحتفاظ بسجل الحذف، ولن يُحذف إذا كان عليه قيود أو مرتبطًا بالخزنة والبنوك أو يحتوي على فروع.`)) void onDelete(account.id) }}><Trash2 size={14} aria-hidden="true" />حذف</button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

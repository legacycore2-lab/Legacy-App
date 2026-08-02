import { HardHat, Loader2, Search, ShieldOff, UsersRound } from 'lucide-react'
import { ContractorDetailsPanel } from '../components/ContractorDetailsPanel'
import { ContractorsTable } from '../components/ContractorsTable'
import { useContractors } from '../hooks/useContractors'
import type { ContractorSort } from '../types/contractor.types'
import '../styles/contractors.css'

const money = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
})

const SORT_OPTIONS: { value: ContractorSort; label: string }[] = [
  { value: 'expense', label: 'الأعلى مصروفات' },
  { value: 'entries', label: 'الأكثر قيودًا' },
  { value: 'latest', label: 'أحدث حركة' },
  { value: 'name', label: 'الاسم' },
]

export function ContractorsPage() {
  const {
    viewModel,
    selectedContractor,
    selectContractor,
    query,
    setQuery,
    sort,
    setSort,
    isLoading,
    error,
  } = useContractors()

  // ── Permission error ──
  if (error && (error.includes('permission') || error.includes('RLS') || error.includes('policy'))) {
    return (
      <div className="contractors-page__permission">
        <ShieldOff size={40} />
        <strong>غير مصرح بعرض بيانات المقاولين</strong>
        <span>تحتاج صلاحية محاسب أو أعلى للوصول إلى هذا القسم.</span>
      </div>
    )
  }

  return (
    <div className={`contractors-page erp-page${selectedContractor ? ' has-panel' : ''}`}>
      <div className="contractors-page__main">
        {/* ── Page header ── */}
        <header className="contractors-page__header">
          <div className="contractors-page__title">
            <HardHat size={28} />
            <div>
              <h1>دليل المقاولين</h1>
              <p>البيانات مستخرجة من القيود المسجلة في النظام — لا تعكس بيانات مستقلة للمقاولين.</p>
            </div>
          </div>
        </header>

        {/* ── KPIs ── */}
        {viewModel && (
          <div className="contractors-page__kpis">
            <article className="contractors-kpi">
              <span>
                <UsersRound size={18} />
              </span>
              <div>
                <small>عدد المقاولين</small>
                <strong>{viewModel.totalContractors}</strong>
              </div>
            </article>
            <article className="contractors-kpi">
              <span className="is-expense">
                <HardHat size={18} />
              </span>
              <div>
                <small>إجمالي المصروفات</small>
                <strong>{money.format(viewModel.totalExpense)}</strong>
              </div>
            </article>
            <article className="contractors-kpi">
              <div>
                <small>المشاريع المرتبطة</small>
                <strong>{viewModel.totalProjects}</strong>
              </div>
            </article>
            <article className="contractors-kpi">
              <div>
                <small>عدد القيود</small>
                <strong>{viewModel.totalEntries}</strong>
              </div>
            </article>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="contractors-page__toolbar">
          <div className="contractors-page__search">
            <Search size={15} />
            <input
              type="search"
              placeholder="ابحث باسم المقاول…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="البحث في المقاولين"
            />
          </div>
          <div className="contractors-page__sort">
            <label htmlFor="contractors-sort">ترتيب:</label>
            <select
              id="contractors-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as ContractorSort)}
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── States ── */}
        {isLoading && (
          <div className="contractors-page__loading">
            <Loader2 size={24} className="spin" />
            <span>جارٍ تحميل بيانات المقاولين…</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="contractors-page__error" role="alert">
            {error}
          </div>
        )}

        {!isLoading && !error && viewModel && viewModel.contractors.length === 0 && (
          <div className="contractors-page__empty">
            <UsersRound size={40} />
            <strong>{query ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات مقاولين بعد'}</strong>
            <span>
              {query
                ? `لم يُعثر على مقاول يطابق "${query}"`
                : 'ستظهر هنا أسماء المقاولين المدخلة في القيود اليومية.'}
            </span>
          </div>
        )}

        {!isLoading && !error && viewModel && viewModel.contractors.length > 0 && (
          <ContractorsTable
            contractors={viewModel.contractors}
            sort={sort}
            onSort={setSort}
            onSelect={selectContractor}
            selectedKey={selectedContractor?.key ?? null}
          />
        )}
      </div>

      {/* ── Details panel ── */}
      {selectedContractor && (
        <ContractorDetailsPanel contractor={selectedContractor} onClose={() => selectContractor(null)} />
      )}
    </div>
  )
}

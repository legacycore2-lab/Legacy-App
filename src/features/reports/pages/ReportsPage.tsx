import { FileBarChart, Printer, RefreshCw, Search } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import { useReports } from '../hooks/useReports'
import '../styles/reports.css'

const statusLabel: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
  unknown: 'غير معروف',
}

export function ReportsPage() {
  const {
    rows,
    summary,
    query,
    setQuery,
    includeArchived,
    setIncludeArchived,
    isLoading,
    error,
    refresh,
  } = useReports()

  return (
    <main className="reports-page">
      <header className="reports-page__header">
        <div>
          <span>مركز التقارير والتحليلات</span>
          <h1>التقارير</h1>
          <p>ملخص مالي مباشر لجميع المشاريع من القيود المسجلة في النظام.</p>
        </div>
        <div className="reports-page__actions">
          <button type="button" onClick={() => void refresh()}>
            <RefreshCw size={17} /> تحديث
          </button>
          <button type="button" className="is-primary" onClick={() => window.print()}>
            <Printer size={17} /> طباعة
          </button>
        </div>
      </header>

      <section className="reports-filters" aria-label="فلاتر التقارير">
        <label className="reports-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث باسم المشروع أو الكود أو العميل..."
          />
        </label>
        <label className="reports-archive-filter">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          إظهار المشاريع المؤرشفة
        </label>
      </section>

      {error ? <div className="reports-state is-error">{error}</div> : null}

      <section className="reports-kpis" aria-label="ملخص المؤشرات">
        <article><span>إجمالي المشاريع</span><strong>{summary?.projectCount ?? 0}</strong></article>
        <article><span>قيمة العقود</span><strong>{formatMoneyInteger(summary?.contractValue ?? 0)}</strong></article>
        <article><span>الإيرادات</span><strong>{formatMoneyInteger(summary?.income ?? 0)}</strong></article>
        <article><span>المصروفات</span><strong>{formatMoneyInteger(summary?.expense ?? 0)}</strong></article>
        <article><span>صافي الحركة</span><strong>{formatMoneyInteger(summary?.net ?? 0)}</strong></article>
        <article><span>المتبقي من العقود</span><strong>{formatMoneyInteger(summary?.remaining ?? 0)}</strong></article>
      </section>

      <section className="reports-panel">
        <div className="reports-panel__heading">
          <div>
            <span>ملخص المشاريع</span>
            <h2>الأداء المالي للمشاريع</h2>
          </div>
          <FileBarChart size={22} />
        </div>

        {isLoading ? (
          <div className="reports-state">جارٍ تحميل بيانات التقارير...</div>
        ) : rows.length === 0 ? (
          <div className="reports-state">لا توجد مشاريع مطابقة للفلاتر الحالية.</div>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>المشروع</th><th>العميل</th><th>الحالة</th><th>قيمة العقد</th>
                  <th>الإيرادات</th><th>المصروفات</th><th>الصافي</th><th>المتبقي</th>
                  <th>الإنجاز</th><th>القيود</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong><small>{row.code}</small></td>
                    <td>{row.client}</td>
                    <td><span className={`reports-status is-${row.status}`}>{statusLabel[row.status] ?? row.status}</span></td>
                    <td>{formatMoneyInteger(row.contractValue)}</td>
                    <td className="is-positive">{formatMoneyInteger(row.income)}</td>
                    <td className="is-negative">{formatMoneyInteger(row.expense)}</td>
                    <td className={row.net >= 0 ? 'is-positive' : 'is-negative'}>{formatMoneyInteger(row.net)}</td>
                    <td>{formatMoneyInteger(row.remaining)}</td>
                    <td><div className="reports-progress"><span style={{ width: `${row.progress}%` }} /></div><small>{row.progress}%</small></td>
                    <td>{row.entryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

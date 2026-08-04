import { BarChart2, FileBarChart, FileText, Lightbulb, Printer, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { formatMoneyInteger } from '../../../shared/formatters'
import { ExecutiveKpis } from '../components/ExecutiveKpis'
import { JournalReportPanel } from '../components/JournalReportPanel'
import { SmartInsightsPanel } from '../components/SmartInsightsPanel'
import { TopProjectsPanel } from '../components/TopProjectsPanel'
import { useAnalytics } from '../hooks/useAnalytics'
import { useReports } from '../hooks/useReports'
import '../styles/reports.css'

type Tab = 'executive' | 'journal' | 'insights'

const statusLabel: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
  unknown: 'غير معروف',
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'executive', label: 'التحليل التنفيذي', icon: BarChart2 },
  { id: 'journal', label: 'تقرير القيود', icon: FileText },
  { id: 'insights', label: 'الرؤى الذكية', icon: Lightbulb },
]

// prettier-ignore
export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('executive')

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

  const { insights, isLoading: insightsLoading } = useAnalytics()

  return (
    <main className="reports-page">
      {/* Header */}
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

      {/* Tabs */}
      <nav className="reports-tabs" aria-label="أقسام التقارير">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`reports-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Executive ── */}
      {tab === 'executive' && (
        <>
          <ExecutiveKpis summary={summary} isLoading={isLoading} />

          <TopProjectsPanel rows={rows} />

          <section className="reports-filters" aria-label="فلاتر التقارير">
            <label className="reports-search">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث باسم المشروع أو الكود أو العميل..."
              />
            </label>
            <label className="reports-archive-filter">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              إظهار المشاريع المؤرشفة
            </label>
          </section>

          {error ? <div className="reports-state is-error">{error}</div> : null}

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
                      <th>المشروع</th>
                      <th>العميل</th>
                      <th>الحالة</th>
                      <th>قيمة العقد</th>
                      <th>الإيرادات</th>
                      <th>المصروفات</th>
                      <th>الصافي</th>
                      <th>المتبقي</th>
                      <th>الإنجاز</th>
                      <th>القيود</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                          <small>{row.code}</small>
                        </td>
                        <td>{row.client}</td>
                        <td>
                          <span className={`reports-status is-${row.status}`}>
                            {statusLabel[row.status] ?? row.status}
                          </span>
                        </td>
                        <td>{formatMoneyInteger(row.contractValue)}</td>
                        <td className="is-positive">{formatMoneyInteger(row.income)}</td>
                        <td className="is-negative">{formatMoneyInteger(row.expense)}</td>
                        <td className={row.net >= 0 ? 'is-positive' : 'is-negative'}>
                          {formatMoneyInteger(row.net)}
                        </td>
                        <td>{formatMoneyInteger(row.remaining)}</td>
                        <td>
                          <div className="reports-progress">
                            <span style={{ width: `${row.progress}%` }} />
                          </div>
                          <small>{row.progress}%</small>
                        </td>
                        <td>{row.entryCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Journal ── */}
      {tab === 'journal' && <JournalReportPanel />}

      {/* ── Insights ── */}
      {tab === 'insights' && (
        <SmartInsightsPanel insights={insights} isLoading={insightsLoading} />
      )}
    </main>
  )
}

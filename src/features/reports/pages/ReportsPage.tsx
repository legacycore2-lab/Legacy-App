import { BarChart3, Brain, FileBarChart, Printer, RefreshCw, Search, TableIcon } from 'lucide-react'
import { useState } from 'react'
import { formatMoneyInteger } from '../../../shared/formatters'
import { ExecutiveKPIsSection } from '../components/ExecutiveKPIs'
import { JournalAnalyticsPanel } from '../components/JournalAnalyticsPanel'
import { ProjectHealthTable } from '../components/ProjectHealthTable'
import { SmartInsightsPanel } from '../components/SmartInsightsPanel'
import { useAnalytics } from '../hooks/useAnalytics'
import { useReports } from '../hooks/useReports'
import '../styles/analytics.css'
import '../styles/reports.css'

type Tab = 'executive' | 'journal' | 'insights' | 'projects'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'executive', label: 'التحليل التنفيذي', icon: BarChart3 },
  { id: 'journal', label: 'تحليل القيود', icon: TableIcon },
  { id: 'insights', label: 'الرؤى الذكية', icon: Brain },
  { id: 'projects', label: 'المشاريع', icon: FileBarChart },
]

const statusLabel: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
  unknown: 'غير معروف',
}

// prettier-ignore
export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('executive')

  const analytics = useAnalytics()
  const reports = useReports()

  const isLoading = analytics.isLoading || reports.isLoading
  const error = analytics.error || reports.error

  return (
    <main className="reports-page">
      {/* header */}
      <header className="reports-page__header">
        <div>
          <span>مركز التقارير والتحليلات</span>
          <h1>التقارير</h1>
          <p>تحليلات مالية متكاملة لجميع المشاريع والقيود اليومية.</p>
        </div>
        <div className="reports-page__actions">
          <button
            type="button"
            onClick={() => {
              void analytics.refresh()
              void reports.refresh()
            }}
          >
            <RefreshCw size={17} /> تحديث
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => window.print()}
          >
            <Printer size={17} /> طباعة
          </button>
        </div>
      </header>

      {error ? <div className="reports-state is-error">{error}</div> : null}

      {/* tabs */}
      <nav className="an-tabs" aria-label="أقسام التقارير">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              className={`an-tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* loading */}
      {isLoading ? (
        <div className="reports-state">جارٍ تحميل بيانات التحليلات...</div>
      ) : (
        <>
          {/* ── Executive ── */}
          {activeTab === 'executive' && analytics.kpis ? (
            <div className="an-section">
              <ExecutiveKPIsSection kpis={analytics.kpis} />

              <div className="an-two-col">
                <ProjectHealthTable
                  items={analytics.topProfitable}
                  title="أعلى ٥ مشاريع ربحية"
                  emptyMessage="لا توجد مشاريع بعد."
                />
                <ProjectHealthTable
                  items={analytics.topLoss}
                  title="أعلى ٥ مشاريع خسارة"
                  emptyMessage="لا توجد مشاريع خاسرة — ممتاز!"
                />
              </div>

              <SmartInsightsPanel insights={analytics.insights} />
            </div>
          ) : null}

          {/* ── Journal ── */}
          {activeTab === 'journal' ? (
            <div className="an-section">
              <JournalAnalyticsPanel
                viewModel={analytics.journalViewModel}
                filters={analytics.filters}
                projectOptions={analytics.projectOptions}
                onFiltersChange={analytics.setFilters}
              />
            </div>
          ) : null}

          {/* ── Insights ── */}
          {activeTab === 'insights' ? (
            <div className="an-section">
              <SmartInsightsPanel insights={analytics.insights} />
            </div>
          ) : null}

          {/* ── Projects (original table) ── */}
          {activeTab === 'projects' ? (
            <div className="an-section">
              <section className="reports-filters" aria-label="فلاتر التقارير">
                <label className="reports-search">
                  <Search size={18} />
                  <input
                    value={reports.query}
                    onChange={(e) => reports.setQuery(e.target.value)}
                    placeholder="بحث باسم المشروع أو الكود أو العميل..."
                  />
                </label>
                <label className="reports-archive-filter">
                  <input
                    type="checkbox"
                    checked={reports.includeArchived}
                    onChange={(e) => reports.setIncludeArchived(e.target.checked)}
                  />
                  إظهار المشاريع المؤرشفة
                </label>
              </section>

              <section className="reports-kpis" aria-label="ملخص المؤشرات">
                <article>
                  <span>إجمالي المشاريع</span>
                  <strong>{reports.summary.projectCount}</strong>
                </article>
                <article>
                  <span>قيمة العقود</span>
                  <strong>{formatMoneyInteger(reports.summary.contractValue)}</strong>
                </article>
                <article>
                  <span>الإيرادات</span>
                  <strong>{formatMoneyInteger(reports.summary.income)}</strong>
                </article>
                <article>
                  <span>المصروفات</span>
                  <strong>{formatMoneyInteger(reports.summary.expense)}</strong>
                </article>
                <article>
                  <span>صافي الحركة</span>
                  <strong>{formatMoneyInteger(reports.summary.net)}</strong>
                </article>
                <article>
                  <span>المتبقي من العقود</span>
                  <strong>{formatMoneyInteger(reports.summary.remaining)}</strong>
                </article>
              </section>

              <section className="reports-panel">
                <div className="reports-panel__heading">
                  <div>
                    <span>ملخص المشاريع</span>
                    <h2>الأداء المالي للمشاريع</h2>
                  </div>
                  <FileBarChart size={22} />
                </div>

                {reports.rows.length === 0 ? (
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
                        {reports.rows.map((row) => (
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
            </div>
          ) : null}
        </>
      )}
    </main>
  )
}

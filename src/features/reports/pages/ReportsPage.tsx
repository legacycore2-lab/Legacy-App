import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { ExecutiveDashboard } from '../components/ExecutiveDashboard'
import { ExecutiveKpis } from '../components/ExecutiveKpis'
import { JournalFilters } from '../components/JournalFilters'
import { JournalReportTable } from '../components/JournalReportTable'
import { JournalSummaryBar } from '../components/JournalSummaryBar'
import { ProjectsReportTable } from '../components/ProjectsReportTable'
import { ReportsCenter } from '../components/ReportsCenter'
import { ReportsEmptyState } from '../components/ReportsEmptyState'
import { ReportsErrorState } from '../components/ReportsErrorState'
import { ReportsHeader } from '../components/ReportsHeader'
import { SmartInsightsPanel } from '../components/SmartInsightsPanel'
import { useExecutiveReports } from '../hooks/useExecutiveReports'
import { useJournalReport } from '../hooks/useJournalReport'
import { useReportsCenter } from '../hooks/useReportsCenter'
import type { ReportKey } from '../types/reports-center.types'
import type { ReportsTab } from '../types/report.types'
import '../styles/reports.css'
import '../styles/reports-center.css'

const REPORT_TITLES: Partial<Record<ReportKey, string>> = {
  executive: 'الملخص التنفيذي',
  projects: 'تقرير المشاريع',
  journal: 'تقرير القيود اليومية',
  insights: 'الرؤى والتنبيهات',
}

function toDataTab(report: ReportKey | null): ReportsTab | null {
  if (report === 'executive' || report === 'projects' || report === 'journal' || report === 'insights') {
    return report
  }
  return null
}

// prettier-ignore
export function ReportsPage() {
  const center = useReportsCenter()
  const activeTab = toDataTab(center.selectedReport)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const executive = useExecutiveReports(activeTab)
  const journal = useJournalReport(activeTab)

  async function handleRefresh() {
    const result = activeTab === 'journal' ? await journal.refresh() : await executive.refresh()
    if (!result.error) setLastUpdated(new Date())
  }

  if (!center.selectedReport) {
    return (
      <main className="reports-page reports-page--center">
        <ReportsCenter
          sections={center.sections}
          query={center.query}
          selectedCategory={center.selectedCategory}
          categories={center.categories}
          totalReports={center.totalReports}
          availableReports={center.availableReports}
          onQueryChange={center.setQuery}
          onCategoryChange={center.setSelectedCategory}
          onOpenReport={center.openReport}
        />
      </main>
    )
  }

  return (
    <main className="reports-page">
      <nav className="report-detail-nav" aria-label="مسار التقرير">
        <button type="button" onClick={center.closeReport}>
          <ArrowRight size={16} aria-hidden />
          العودة لمركز التقارير
        </button>
        <span>التقارير</span>
        <span aria-hidden>/</span>
        <strong>{REPORT_TITLES[center.selectedReport] ?? 'التقرير'}</strong>
      </nav>

      <ReportsHeader onRefresh={handleRefresh} lastUpdated={lastUpdated} />

      {activeTab === 'executive' && (
        <>
          {executive.isPermissionDenied ? (
            <ReportsErrorState error={executive.error} isPermission />
          ) : executive.error ? (
            <ReportsErrorState error={executive.error} />
          ) : (
            <>
              {executive.summary ? (
                <ExecutiveKpis summary={executive.summary} isLoading={executive.isLoading} />
              ) : null}
              {executive.topProjects && !executive.isLoading ? (
                <ExecutiveDashboard topProjects={executive.topProjects} />
              ) : null}
              {executive.summary && !executive.isLoading && executive.allRows.length === 0 ? (
                <ReportsEmptyState message="لا توجد مشاريع حتى الآن." />
              ) : null}
            </>
          )}
        </>
      )}

      {activeTab === 'projects' && (
        <>
          {executive.isPermissionDenied ? (
            <ReportsErrorState error={executive.error} isPermission />
          ) : executive.error ? (
            <ReportsErrorState error={executive.error} />
          ) : (
            <ProjectsReportTable
              rows={executive.filteredRows}
              query={executive.query}
              onQueryChange={executive.setQuery}
              includeArchived={executive.includeArchived}
              onIncludeArchivedChange={executive.setIncludeArchived}
              statusFilter={executive.statusFilter}
              onStatusFilterChange={executive.setStatusFilter}
              isLoading={executive.isLoading}
            />
          )}
        </>
      )}

      {activeTab === 'journal' && (
        <section className="reports-panel">
          <div className="reports-panel__heading">
            <div>
              <span className="reports-label">القيود اليومية</span>
              <h2>تقرير القيود</h2>
            </div>
          </div>
          <JournalFilters
            filters={journal.filters}
            hasActiveFilter={journal.hasActiveFilter}
            contractors={journal.contractors}
            paymentMethods={journal.paymentMethods}
            projectOptions={journal.projectOptions}
            onSetFilter={journal.setFilter}
            onReset={journal.resetFilters}
          />
          <JournalSummaryBar summary={journal.summary} />
          {journal.isPermissionDenied ? (
            <ReportsErrorState error={journal.error} isPermission />
          ) : journal.error ? (
            <ReportsErrorState error={journal.error} />
          ) : (
            <JournalReportTable
              rows={journal.paginatedRows}
              isLoading={journal.isLoading}
              page={journal.page}
              totalPages={journal.totalPages}
              totalCount={journal.totalCount}
              onPageChange={journal.setPage}
            />
          )}
        </section>
      )}

      {activeTab === 'insights' && (
        <>
          {executive.isPermissionDenied ? (
            <ReportsErrorState error={executive.error} isPermission />
          ) : executive.error ? (
            <ReportsErrorState error={executive.error} />
          ) : (
            <SmartInsightsPanel insights={executive.insights} isLoading={executive.isLoading} />
          )}
        </>
      )}
    </main>
  )
}

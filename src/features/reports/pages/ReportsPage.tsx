import { useState } from 'react'
import { ExecutiveDashboard } from '../components/ExecutiveDashboard'
import { ExecutiveKpis } from '../components/ExecutiveKpis'
import { JournalFilters } from '../components/JournalFilters'
import { JournalReportTable } from '../components/JournalReportTable'
import { JournalSummaryBar } from '../components/JournalSummaryBar'
import { ProjectsReportTable } from '../components/ProjectsReportTable'
import { ReportsEmptyState } from '../components/ReportsEmptyState'
import { ReportsErrorState } from '../components/ReportsErrorState'
import { ReportsHeader } from '../components/ReportsHeader'
import { ReportsTabs } from '../components/ReportsTabs'
import { SmartInsightsPanel } from '../components/SmartInsightsPanel'
import { useExecutiveReports } from '../hooks/useExecutiveReports'
import { useJournalReport } from '../hooks/useJournalReport'
import type { ReportsTab } from '../types/report.types'
import '../styles/reports.css'

// prettier-ignore
export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('executive')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const executive = useExecutiveReports(activeTab)
  const journal = useJournalReport(activeTab)

  async function handleRefresh() {
    const result =
      activeTab === 'journal' ? await journal.refresh() : await executive.refresh()
    if (!result.error) {
      setLastUpdated(new Date())
    }
  }

  return (
    <main className="reports-page">
      <ReportsHeader onRefresh={handleRefresh} lastUpdated={lastUpdated} />

      <ReportsTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Executive ── */}
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

      {/* ── Projects ── */}
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

      {/* ── Journal ── */}
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

      {/* ── Insights ── */}
      {activeTab === 'insights' && (
        <>
          {executive.isPermissionDenied ? (
            <ReportsErrorState error={executive.error} isPermission />
          ) : (
            <SmartInsightsPanel insights={executive.insights} isLoading={executive.isLoading} />
          )}
        </>
      )}
    </main>
  )
}

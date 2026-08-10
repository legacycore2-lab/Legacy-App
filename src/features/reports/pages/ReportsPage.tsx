import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { ContractorReportsPanel } from '../components/ContractorReportsPanel'
import type { ContractorReportSection } from '../components/ContractorReportsPanel'
import { ExecutiveDashboard } from '../components/ExecutiveDashboard'
import { ExecutiveKpis } from '../components/ExecutiveKpis'
import { JournalFilters } from '../components/JournalFilters'
import { JournalReportTable } from '../components/JournalReportTable'
import { JournalSummaryBar } from '../components/JournalSummaryBar'
import { ProfitLossReportPanel } from '../components/ProfitLossReportPanel'
import { ProjectsReportTable } from '../components/ProjectsReportTable'
import { ReportsCenter } from '../components/ReportsCenter'
import { ReportsEmptyState } from '../components/ReportsEmptyState'
import { ReportsErrorState } from '../components/ReportsErrorState'
import { ReportsHeader } from '../components/ReportsHeader'
import { SmartInsightsPanel } from '../components/SmartInsightsPanel'
import { useContractorReports } from '../hooks/useContractorReports'
import { useExecutiveReports } from '../hooks/useExecutiveReports'
import { useJournalReport } from '../hooks/useJournalReport'
import { useProfitLossReport } from '../hooks/useProfitLossReport'
import { useReportExport } from '../hooks/useReportExport'
import { useReportsCenter } from '../hooks/useReportsCenter'
import type { ReportKey } from '../types/reports-center.types'
import type { ReportsTab, TabularRow } from '../types/report.types'
import '../styles/contractor-reports.css'
import '../styles/profit-loss.css'
import '../styles/reports-center.css'
import '../styles/reports.css'

const CONTRACTOR_REPORT_KEYS = new Set<ReportKey>([
  'contractor-statement',
  'contractor-dues',
  'contractor-payments',
  'top-contractors',
])

const REPORT_TITLES: Partial<Record<ReportKey, string>> = {
  executive: 'الملخص التنفيذي',
  projects: 'تقرير المشاريع',
  journal: 'تقرير القيود اليومية',
  insights: 'الرؤى والتنبيهات',
  'profit-loss': 'الأرباح والخسائر',
  'project-comparison': 'مقارنة المشاريع',
  'profitable-projects': 'المشاريع الأكثر ربحًا',
  'loss-making-projects': 'المشاريع الخاسرة',
  'contract-values': 'قيمة العقود',
  'income-expense': 'الإيرادات والمصروفات',
  'contractor-statement': 'كشف حساب المقاول',
  'contractor-dues': 'تحليلات حركة المقاولين',
  'contractor-payments': 'مدفوعات المقاولين',
  'top-contractors': 'أعلى المقاولين تكلفة',
}

function toDataTab(report: ReportKey | null): ReportsTab | null {
  if (report === 'executive' || report === 'projects' || report === 'journal' || report === 'insights') {
    return report
  }
  if (
    report === 'project-comparison' ||
    report === 'profitable-projects' ||
    report === 'loss-making-projects' ||
    report === 'contract-values' ||
    report === 'income-expense'
  ) {
    return 'projects'
  }
  return null
}

function toContractorSection(report: ReportKey | null): ContractorReportSection {
  if (report === 'contractor-statement') return 'statement'
  if (report === 'contractor-payments') return 'payments'
  return 'overview'
}

export function ReportsPage() {
  const center = useReportsCenter()
  const activeTab = toDataTab(center.selectedReport)
  const isProfitLoss = center.selectedReport === 'profit-loss'
  const isContractorStatement = center.selectedReport === 'contractor-statement'
  const isContractors = center.selectedReport ? CONTRACTOR_REPORT_KEYS.has(center.selectedReport) : false
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const initialContractorSection = toContractorSection(center.selectedReport)
  const [contractorNavigation, setContractorNavigation] = useState<{
    report: ReportKey | null
    section: ContractorReportSection
  }>({ report: null, section: 'overview' })
  const contractorSection =
    contractorNavigation.report === center.selectedReport
      ? contractorNavigation.section
      : initialContractorSection

  const executive = useExecutiveReports(activeTab)
  const journal = useJournalReport(activeTab)
  const profitLoss = useProfitLossReport(isProfitLoss)
  const contractorReports = useContractorReports(isContractors)
  const {
    isExporting,
    exportError,
    exportExecutivePdf,
    exportProjectsPdf,
    exportJournalPdf,
    exportProfitLossPdf,
    exportContractorsPdf,
    exportContractorStatementPdf,
    exportTable,
  } = useReportExport()

  const projectRows =
    center.selectedReport === 'profitable-projects'
      ? executive.filteredRows.filter((row) => row.net > 0).sort((a, b) => b.net - a.net)
      : center.selectedReport === 'loss-making-projects'
        ? executive.filteredRows.filter((row) => row.net < 0).sort((a, b) => a.net - b.net)
        : executive.filteredRows

  async function handleRefresh() {
    const result = isContractors
      ? await contractorReports.refresh()
      : isProfitLoss
        ? await profitLoss.refresh()
        : activeTab === 'journal'
          ? await journal.refresh()
          : await executive.refresh()
    if (!result.error) setLastUpdated(new Date())
  }

  function buildExportPdf(): (() => void) | undefined {
    if (activeTab === 'executive' && executive.allRows.length > 0 && executive.summary) {
      return () =>
        exportExecutivePdf({
          summary: executive.summary!,
          topProjects: executive.topProjects!,
          rows: executive.allRows,
        })
    }
    if (activeTab === 'projects') {
      return () =>
        exportProjectsPdf(projectRows, {
          query: executive.draftQuery,
          statusFilter: executive.draftStatusFilter,
          includeArchived: executive.draftIncludeArchived,
        })
    }
    if (activeTab === 'journal' && journal.filteredRows.length > 0) {
      return () =>
        exportJournalPdf(
          {
            allRows: journal.filteredRows,
            contractors: journal.contractors,
            paymentMethods: journal.paymentMethods,
            projectOptions: journal.projectOptions,
          },
          journal.filters,
          journal.totalCount,
        )
    }
    if (isProfitLoss && profitLoss.data) {
      return () => exportProfitLossPdf(profitLoss.data!, profitLoss.filters)
    }
    if (
      isContractorStatement &&
      contractorReports.data &&
      contractorReports.committedFilters.contractorName
    ) {
      return () => exportContractorStatementPdf(contractorReports.data!, contractorReports.committedFilters)
    }
    if (isContractors && contractorReports.data) {
      return () =>
        exportContractorsPdf(
          contractorReports.data!,
          contractorReports.committedFilters,
          contractorSection,
          contractorReports.committedFilters.contractorName,
        )
    }
    return undefined
  }

  function buildTabularRows(): TabularRow[] {
    if (activeTab === 'executive' || activeTab === 'projects') {
      const rows = activeTab === 'executive' ? executive.allRows : projectRows
      return rows.map((row) => ({
        'كود المشروع': row.code,
        'اسم المشروع': row.name,
        العميل: row.client,
        الحالة: row.status,
        'نسبة الإنجاز': row.progress,
        'قيمة العقد': row.contractValue,
        الإيرادات: row.income,
        المصروفات: row.expense,
        الصافي: row.net,
        المتبقي: row.remaining,
      }))
    }
    if (activeTab === 'journal') {
      return journal.filteredRows.map((row) => ({
        التاريخ: row.dateFormatted,
        النوع: row.entryType,
        المشروع: row.projectName,
        المقاول: row.contractorName,
        البيان: row.description,
        'طريقة الدفع': row.paymentMethod,
        المبلغ: row.amount,
      }))
    }
    if (isProfitLoss && profitLoss.data) {
      return profitLoss.data.projectRows.map((row) => ({
        المشروع: row.projectName,
        'قيمة العقد': row.contractValue,
        الإيرادات: row.income,
        المصروفات: row.expense,
        الصافي: row.net,
        'هامش الربح': row.marginPercent,
        'عدد القيود': row.entryCount,
      }))
    }
    if (isContractors && contractorReports.data) {
      if (center.selectedReport === 'contractor-payments') {
        return contractorReports.data.paymentMethods.map((row) => ({
          المقاول: row.contractorName,
          'طريقة الدفع': row.paymentMethod,
          القيمة: row.totalAmount,
          'عدد القيود': row.entryCount,
          النسبة: row.percentageOfContractorMovement,
        }))
      }
      if (center.selectedReport === 'top-contractors') {
        return [...contractorReports.data.contractors]
          .sort((a, b) => b.totalExpense - a.totalExpense)
          .map((row, index) => ({
            الترتيب: index + 1,
            المقاول: row.contractorName,
            'إجمالي التكلفة': row.totalExpense,
            'عدد المشاريع': row.projectCount,
            'عدد القيود': row.entryCount,
            'آخر نشاط': row.lastActivityDate,
          }))
      }
      return contractorReports.data.contractors.map((row) => ({
        المقاول: row.contractorName,
        الإيرادات: row.totalIncome,
        المصروفات: row.totalExpense,
        'صافي الحركة': row.netMovement,
        'عدد القيود': row.entryCount,
        'عدد المشاريع': row.projectCount,
        'آخر نشاط': row.lastActivityDate,
      }))
    }
    return []
  }

  const tabularRows = buildTabularRows()

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

      <ReportsHeader
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        onExportPdf={buildExportPdf()}
        onExportExcel={
          tabularRows.length
            ? () => exportTable(tabularRows, 'xlsx', center.selectedReport ?? 'report')
            : undefined
        }
        onExportCsv={
          tabularRows.length
            ? () => exportTable(tabularRows, 'csv', center.selectedReport ?? 'report')
            : undefined
        }
        isExporting={isExporting}
      />

      {exportError ? (
        <div className="reports-export-error" role="alert">
          {exportError}
        </div>
      ) : null}

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
              rows={projectRows}
              query={executive.draftQuery}
              onQueryChange={executive.setDraftQuery}
              includeArchived={executive.draftIncludeArchived}
              onIncludeArchivedChange={executive.setDraftIncludeArchived}
              statusFilter={executive.draftStatusFilter}
              onStatusFilterChange={executive.setDraftStatusFilter}
              filtersDirty={executive.filtersDirty}
              isLoading={executive.isLoading}
              onSearch={executive.commitSearch}
              onReset={executive.resetFilters}
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
            filtersDirty={journal.filtersDirty}
            contractors={journal.contractors}
            paymentMethods={journal.paymentMethods}
            projectOptions={journal.projectOptions}
            onSetFilter={journal.setFilter}
            onSearch={journal.commitSearch}
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

      {isProfitLoss && (
        <>
          {profitLoss.isPermissionDenied ? (
            <ReportsErrorState error={profitLoss.error} isPermission />
          ) : profitLoss.error ? (
            <ReportsErrorState error={profitLoss.error} />
          ) : profitLoss.data ? (
            <ProfitLossReportPanel
              data={profitLoss.data}
              filters={profitLoss.filters}
              hasActiveFilter={profitLoss.hasActiveFilter}
              filtersDirty={profitLoss.filtersDirty}
              isFetching={profitLoss.isFetching}
              onSetFilter={profitLoss.setFilter}
              onSearch={profitLoss.commitSearch}
              onReset={profitLoss.resetFilters}
            />
          ) : (
            <ReportsEmptyState message="جاري تحميل تقرير الأرباح والخسائر..." />
          )}
        </>
      )}

      {isContractors && (
        <>
          {contractorReports.isPermissionDenied ? (
            <ReportsErrorState error={contractorReports.error} isPermission />
          ) : contractorReports.error ? (
            <ReportsErrorState error={contractorReports.error} />
          ) : contractorReports.data ? (
            <ContractorReportsPanel
              key={center.selectedReport}
              data={contractorReports.data}
              filters={contractorReports.filters}
              hasActiveFilter={contractorReports.hasActiveFilter}
              filtersDirty={contractorReports.filtersDirty}
              isFetching={contractorReports.isFetching}
              page={contractorReports.page}
              totalPages={contractorReports.totalPages}
              totalCount={contractorReports.totalCount}
              paginatedEntries={contractorReports.paginatedEntries}
              onSetFilter={contractorReports.setFilter}
              onSearch={contractorReports.commitSearch}
              onReset={contractorReports.resetFilters}
              onPageChange={contractorReports.setPage}
              initialSection={initialContractorSection}
              onSectionChange={(section) =>
                setContractorNavigation({ report: center.selectedReport, section })
              }
            />
          ) : (
            <ReportsEmptyState message="جاري تحميل تقارير المقاولين..." />
          )}
        </>
      )}
    </main>
  )
}

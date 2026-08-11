import { useMemo } from 'react'
import {
  buildReportTabularRows,
  getReportTitle,
  isContractorReport,
  resolveContractorReportSection,
  resolveReportsTab,
  selectProjectReportRows,
} from '../services/reports-presentation.service'
import type { ContractorReportSection } from '../services/reports-presentation.service'
import type { ContractorReportsViewModel } from '../types/contractor-reports.types'
import type { ProfitLossViewModel } from '../types/profit-loss.types'
import type { ReportKey } from '../types/reports-center.types'
import type { ReportJournalRow, ReportProjectRow, ReportsTab } from '../types/report.types'

export type { ContractorReportSection }

type UseReportsPresentationInput = {
  selectedReport: ReportKey | null
  activeTab: ReportsTab | null
  executiveRows: ReportProjectRow[]
  filteredExecutiveRows: ReportProjectRow[]
  journalRows: ReportJournalRow[]
  profitLoss: ProfitLossViewModel | null
  contractors: ContractorReportsViewModel | null
}

export function useReportsMode(selectedReport: ReportKey | null) {
  return useMemo(() => {
    const activeTab = resolveReportsTab(selectedReport)

    return {
      activeTab,
      isProfitLoss: selectedReport === 'profit-loss',
      isContractorStatement: selectedReport === 'contractor-statement',
      isContractors: isContractorReport(selectedReport),
      initialContractorSection: resolveContractorReportSection(selectedReport),
      reportTitle: getReportTitle(selectedReport),
    }
  }, [selectedReport])
}

export function useReportsPresentation(input: UseReportsPresentationInput) {
  const projectRows = useMemo(
    () => selectProjectReportRows(input.selectedReport, input.filteredExecutiveRows),
    [input.selectedReport, input.filteredExecutiveRows],
  )

  const tabularRows = useMemo(
    () =>
      buildReportTabularRows({
        selectedReport: input.selectedReport,
        activeTab: input.activeTab,
        executiveRows: input.executiveRows,
        projectRows,
        journalRows: input.journalRows,
        profitLoss: input.profitLoss,
        contractors: input.contractors,
      }),
    [
      input.selectedReport,
      input.activeTab,
      input.executiveRows,
      input.journalRows,
      input.profitLoss,
      input.contractors,
      projectRows,
    ],
  )

  return {
    projectRows,
    tabularRows,
  }
}

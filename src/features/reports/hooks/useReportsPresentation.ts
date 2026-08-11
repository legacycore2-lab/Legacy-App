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
import type { ReportJournalRow, ReportProjectRow } from '../types/report.types'

export type { ContractorReportSection }

type UseReportsPresentationInput = {
  selectedReport: ReportKey | null
  executiveRows: ReportProjectRow[]
  filteredExecutiveRows: ReportProjectRow[]
  journalRows: ReportJournalRow[]
  profitLoss: ProfitLossViewModel | null
  contractors: ContractorReportsViewModel | null
}

export function useReportsPresentation(input: UseReportsPresentationInput) {
  const activeTab = resolveReportsTab(input.selectedReport)
  const isProfitLoss = input.selectedReport === 'profit-loss'
  const isContractorStatement = input.selectedReport === 'contractor-statement'
  const isContractors = isContractorReport(input.selectedReport)
  const initialContractorSection = resolveContractorReportSection(input.selectedReport)
  const reportTitle = getReportTitle(input.selectedReport)

  const projectRows = useMemo(
    () => selectProjectReportRows(input.selectedReport, input.filteredExecutiveRows),
    [input.selectedReport, input.filteredExecutiveRows],
  )

  const tabularRows = useMemo(
    () =>
      buildReportTabularRows({
        selectedReport: input.selectedReport,
        activeTab,
        executiveRows: input.executiveRows,
        projectRows,
        journalRows: input.journalRows,
        profitLoss: input.profitLoss,
        contractors: input.contractors,
      }),
    [
      input.selectedReport,
      input.executiveRows,
      input.journalRows,
      input.profitLoss,
      input.contractors,
      activeTab,
      projectRows,
    ],
  )

  return {
    activeTab,
    isProfitLoss,
    isContractorStatement,
    isContractors,
    initialContractorSection,
    reportTitle,
    projectRows,
    tabularRows,
  }
}

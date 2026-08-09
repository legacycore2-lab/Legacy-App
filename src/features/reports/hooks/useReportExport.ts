import { useState } from 'react'
import { buildContractorStatement } from '../services/contractor-statement.service'
import { downloadContractorStatementPdf } from '../services/contractor-statement-renderer.service'
import { buildPdfFilename, downloadPdf } from '../services/pdf-export.service'
import { downloadCsv, downloadExcel } from '../services/tabular-export.service'
import {
  buildContractorsPdfPayload,
  buildExecutivePdfPayload,
  buildJournalPdfPayload,
  buildProfitLossPdfPayload,
  buildProjectsPdfPayload,
} from '../services/pdf-payload.service'
import type { ContractorReportsFilters, ContractorReportsViewModel } from '../types/contractor-reports.types'
import type { ProfitLossFilters, ProfitLossViewModel } from '../types/profit-loss.types'
import type {
  ExecutiveViewModel,
  JournalReportFilters,
  JournalReportViewModel,
  TabularRow,
} from '../types/report.types'

type ContractorSection =
  'overview' | 'statement' | 'projects' | 'categories' | 'monthly' | 'payments' | 'quality'

export function useReportExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function runExport(fn: () => Promise<void>) {
    setIsExporting(true)
    setExportError(null)
    try {
      await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر تصدير PDF'
      setExportError(msg)
    } finally {
      setIsExporting(false)
    }
  }

  function exportExecutivePdf(data: ExecutiveViewModel) {
    void runExport(async () => {
      const payload = buildExecutivePdfPayload(data)
      const filename = buildPdfFilename({ reportKey: 'executive-report' })
      await downloadPdf(payload, filename)
    })
  }

  function exportProjectsPdf(
    rows: ExecutiveViewModel['rows'],
    filters: { query: string; statusFilter: string; includeArchived: boolean },
  ) {
    void runExport(async () => {
      const payload = buildProjectsPdfPayload(rows, filters)
      const filename = buildPdfFilename({ reportKey: 'projects-report' })
      await downloadPdf(payload, filename)
    })
  }

  function exportJournalPdf(
    data: JournalReportViewModel,
    filters: JournalReportFilters,
    filteredCount: number,
  ) {
    void runExport(async () => {
      const payload = buildJournalPdfPayload(data, filters, filteredCount)
      const filename = buildPdfFilename({ reportKey: 'journal-report' })
      await downloadPdf(payload, filename)
    })
  }

  function exportProfitLossPdf(data: ProfitLossViewModel, filters: ProfitLossFilters) {
    void runExport(async () => {
      const payload = buildProfitLossPdfPayload(data, filters)
      const filename = buildPdfFilename({ reportKey: 'profit-loss-report' })
      await downloadPdf(payload, filename)
    })
  }

  function exportContractorsPdf(
    data: ContractorReportsViewModel,
    filters: ContractorReportsFilters,
    section: ContractorSection,
    contextLabel?: string,
  ) {
    void runExport(async () => {
      const payload = buildContractorsPdfPayload(data, filters, section)
      const filename = buildPdfFilename({
        reportKey: 'contractor-report',
        contextLabel: contextLabel ?? filters.contractorName,
      })
      await downloadPdf(payload, filename)
    })
  }

  function exportContractorStatementPdf(data: ContractorReportsViewModel, filters: ContractorReportsFilters) {
    void runExport(async () => {
      const statement = buildContractorStatement(data.entries, filters.contractorName)
      const filename = buildPdfFilename({
        reportKey: 'contractor-statement',
        contextLabel: filters.contractorName,
      })
      await downloadContractorStatementPdf(statement, filters, data.projectOptions, filename)
    })
  }

  function exportTable(rows: TabularRow[], format: 'xlsx' | 'csv', reportKey: string) {
    void runExport(async () => {
      const date = new Date().toISOString().slice(0, 10)
      if (format === 'xlsx') await downloadExcel(rows, `${reportKey}-${date}.xlsx`)
      else downloadCsv(rows, `${reportKey}-${date}.csv`)
    })
  }

  return {
    isExporting,
    exportError,
    exportExecutivePdf,
    exportProjectsPdf,
    exportJournalPdf,
    exportProfitLossPdf,
    exportContractorsPdf,
    exportContractorStatementPdf,
    exportTable,
  }
}

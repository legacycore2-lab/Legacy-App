import { useState } from 'react'
import { downloadPdf, buildPdfFilename } from '../services/pdf-export.service'
import {
  buildExecutivePdfPayload,
  buildProjectsPdfPayload,
  buildJournalPdfPayload,
  buildProfitLossPdfPayload,
  buildContractorsPdfPayload,
} from '../services/pdf-payload.service'
import type { ContractorReportsFilters, ContractorReportsViewModel } from '../types/contractor-reports.types'
import type { ProfitLossFilters, ProfitLossViewModel } from '../types/profit-loss.types'
import type { ExecutiveViewModel, JournalReportFilters, JournalReportViewModel } from '../types/report.types'

type ContractorSection =
  'overview' | 'statement' | 'projects' | 'categories' | 'monthly' | 'payments' | 'quality'

export function useReportExport() {
  const [isExporting, setIsExporting] = useState(false)

  function exportExecutivePdf(data: ExecutiveViewModel) {
    setIsExporting(true)
    try {
      const payload = buildExecutivePdfPayload(data)
      const filename = buildPdfFilename({ reportKey: 'executive-report' })
      downloadPdf(payload, filename)
    } finally {
      setIsExporting(false)
    }
  }

  function exportProjectsPdf(
    rows: ExecutiveViewModel['rows'],
    filters: { query: string; statusFilter: string; includeArchived: boolean },
  ) {
    setIsExporting(true)
    try {
      const payload = buildProjectsPdfPayload(rows, filters)
      const filename = buildPdfFilename({ reportKey: 'projects-report' })
      downloadPdf(payload, filename)
    } finally {
      setIsExporting(false)
    }
  }

  function exportJournalPdf(
    data: JournalReportViewModel,
    filters: JournalReportFilters,
    filteredCount: number,
  ) {
    setIsExporting(true)
    try {
      const payload = buildJournalPdfPayload(data, filters, filteredCount)
      const filename = buildPdfFilename({ reportKey: 'journal-report' })
      downloadPdf(payload, filename)
    } finally {
      setIsExporting(false)
    }
  }

  function exportProfitLossPdf(data: ProfitLossViewModel, filters: ProfitLossFilters) {
    setIsExporting(true)
    try {
      const payload = buildProfitLossPdfPayload(data, filters)
      const filename = buildPdfFilename({ reportKey: 'profit-loss-report' })
      downloadPdf(payload, filename)
    } finally {
      setIsExporting(false)
    }
  }

  function exportContractorsPdf(
    data: ContractorReportsViewModel,
    filters: ContractorReportsFilters,
    section: ContractorSection,
    contextLabel?: string,
  ) {
    setIsExporting(true)
    try {
      const payload = buildContractorsPdfPayload(data, filters, section)
      const filename = buildPdfFilename({
        reportKey: 'contractor-report',
        contextLabel: contextLabel ?? filters.contractorName,
      })
      downloadPdf(payload, filename)
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportExecutivePdf,
    exportProjectsPdf,
    exportJournalPdf,
    exportProfitLossPdf,
    exportContractorsPdf,
  }
}

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { filterJournalRows, loadJournalReportData, summarizeJournalRows } from '../services/reports.service'
import type { JournalReportFilters, ReportsTab } from '../types/report.types'

const EMPTY_FILTERS: JournalReportFilters = {
  query: '',
  dateFrom: '',
  dateTo: '',
  projectId: '',
  entryType: 'all',
  contractorName: '',
  paymentMethod: '',
}

export function useJournalReport(activeTab: ReportsTab) {
  const [filters, setFilters] = useState<JournalReportFilters>(EMPTY_FILTERS)

  const q = useQuery({
    queryKey: ['reports', 'journal'],
    queryFn: loadJournalReportData,
    staleTime: 30_000,
    enabled: activeTab === 'journal',
  })

  const allRows = q.data?.allRows ?? []
  const filteredRows = filterJournalRows(allRows, filters)
  const summary = summarizeJournalRows(filteredRows)

  function setFilter<K extends keyof JournalReportFilters>(key: K, value: JournalReportFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
  }

  const hasActiveFilter =
    filters.query !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.projectId !== '' ||
    filters.entryType !== 'all' ||
    filters.contractorName !== '' ||
    filters.paymentMethod !== ''

  return {
    filteredRows,
    summary,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilter,
    contractors: q.data?.contractors ?? [],
    paymentMethods: q.data?.paymentMethods ?? [],
    projectOptions: q.data?.projectOptions ?? [],
    isLoading: q.isLoading,
    error: q.error ? toErrorMessage(q.error, 'تعذر تحميل تقرير القيود.') : '',
    refresh: q.refetch,
  }
}

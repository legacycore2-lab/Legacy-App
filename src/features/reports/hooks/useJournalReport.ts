import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { isPermissionError, toErrorMessage } from '../../../shared/errors/app-error'
import {
  filterJournalRows,
  loadJournalReportData,
  paginateRows,
  summarizeJournalRows,
} from '../services/reports.service'
import type { JournalReportFilters, ReportsTab } from '../types/report.types'

export const JOURNAL_PAGE_SIZE = 50

const EMPTY_FILTERS: JournalReportFilters = {
  query: '',
  dateFrom: '',
  dateTo: '',
  projectId: '',
  entryType: 'all',
  contractorName: '',
  paymentMethod: '',
}

export function useJournalReport(activeTab: ReportsTab | null) {
  // Draft (local) filters — not yet committed
  const [draftFilters, setDraftFilters] = useState<JournalReportFilters>(EMPTY_FILTERS)
  // Committed filters — applied after Search press
  const [committedFilters, setCommittedFilters] = useState<JournalReportFilters>(EMPTY_FILTERS)
  const [filtersDirty, setFiltersDirty] = useState(false)
  const [page, setPage] = useState(1)

  const q = useQuery({
    queryKey: ['reports', 'journal'],
    queryFn: loadJournalReportData,
    staleTime: 30_000,
    enabled: activeTab === 'journal',
  })

  const allRows = q.data?.allRows ?? []
  const filteredRows = filterJournalRows(allRows, committedFilters)
  const summary = summarizeJournalRows(filteredRows)
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / JOURNAL_PAGE_SIZE))
  const clampedPage = Math.min(Math.max(1, page), totalPages)
  const paginatedRows = paginateRows(filteredRows, clampedPage, JOURNAL_PAGE_SIZE)

  function setDraftFilter<K extends keyof JournalReportFilters>(key: K, value: JournalReportFilters[K]) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
    setFiltersDirty(true)
  }

  function commitSearch() {
    setCommittedFilters(draftFilters)
    setPage(1)
    setFiltersDirty(false)
  }

  function resetFilters() {
    setDraftFilters(EMPTY_FILTERS)
    setFiltersDirty(false)
  }

  const hasActiveFilter = Object.entries(committedFilters).some(([key, value]) =>
    key === 'entryType' ? value !== 'all' : Boolean(value),
  )

  return {
    paginatedRows,
    filteredRows,
    summary,
    filters: draftFilters,
    setFilter: setDraftFilter,
    commitSearch,
    resetFilters,
    filtersDirty,
    hasActiveFilter,
    page: clampedPage,
    setPage,
    totalPages,
    totalCount: filteredRows.length,
    contractors: q.data?.contractors ?? [],
    paymentMethods: q.data?.paymentMethods ?? [],
    projectOptions: q.data?.projectOptions ?? [],
    isLoading: q.isLoading,
    isPermissionDenied: isPermissionError(q.error),
    error: q.error ? toErrorMessage(q.error, 'تعذر تحميل تقرير القيود.') : '',
    refresh: q.refetch,
  }
}

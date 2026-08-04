import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { isPermissionError, toErrorMessage } from '../../../shared/errors/app-error'
import { paginateRows } from '../services/reports.service'
import { loadContractorReportsData } from '../services/contractor-reports.service'
import type { ContractorReportsFilters } from '../types/contractor-reports.types'

const EMPTY_FILTERS: ContractorReportsFilters = {
  query: '',
  contractorName: '',
  projectId: '',
  category: '',
  entryType: 'all',
  dateFrom: '',
  dateTo: '',
}

const PAGE_SIZE = 50

export function useContractorReports(enabled: boolean) {
  // Draft (local) filters — not yet committed
  const [draftFilters, setDraftFilters] = useState<ContractorReportsFilters>(EMPTY_FILTERS)
  // Committed filters — passed to queryFn only after Search press
  const [committedFilters, setCommittedFilters] = useState<ContractorReportsFilters>(EMPTY_FILTERS)
  const [filtersDirty, setFiltersDirty] = useState(false)
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['reports', 'contractors', committedFilters],
    queryFn: () => loadContractorReportsData(committedFilters),
    staleTime: 30_000,
    enabled,
  })

  const totalCount = query.data?.entries.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedEntries = useMemo(
    () => paginateRows(query.data?.entries ?? [], safePage, PAGE_SIZE),
    [query.data?.entries, safePage],
  )

  function setDraftFilter<K extends keyof ContractorReportsFilters>(
    key: K,
    value: ContractorReportsFilters[K],
  ) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
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

  return {
    data: query.data,
    filters: draftFilters,
    setFilter: setDraftFilter,
    commitSearch,
    resetFilters,
    filtersDirty,
    hasActiveFilter: Object.entries(committedFilters).some(([key, value]) =>
      key === 'entryType' ? value !== 'all' : Boolean(value),
    ),
    page: safePage,
    setPage,
    totalPages,
    totalCount,
    paginatedEntries,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPermissionDenied: isPermissionError(query.error),
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل تقارير المقاولين.') : '',
    refresh: query.refetch,
  }
}

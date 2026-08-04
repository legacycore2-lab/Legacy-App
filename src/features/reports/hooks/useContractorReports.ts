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
  const [filters, setFilters] = useState<ContractorReportsFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['reports', 'contractors', filters],
    queryFn: () => loadContractorReportsData(filters),
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

  function setFilter<K extends keyof ContractorReportsFilters>(
    key: K,
    value: ContractorReportsFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  return {
    data: query.data,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilter: Object.entries(filters).some(([key, value]) =>
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

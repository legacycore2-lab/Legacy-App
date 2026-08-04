import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { isPermissionError, toErrorMessage } from '../../../shared/errors/app-error'
import { loadProfitLossData } from '../services/profit-loss.service'
import type { ProfitLossFilters } from '../types/profit-loss.types'

const EMPTY_FILTERS: ProfitLossFilters = {
  dateFrom: '',
  dateTo: '',
  projectId: '',
}

export function useProfitLossReport(enabled: boolean) {
  const [filters, setFilters] = useState<ProfitLossFilters>(EMPTY_FILTERS)

  const query = useQuery({
    queryKey: ['reports', 'profit-loss', filters],
    queryFn: () => loadProfitLossData(filters),
    staleTime: 30_000,
    enabled,
  })

  function setFilter<K extends keyof ProfitLossFilters>(key: K, value: ProfitLossFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
  }

  return {
    data: query.data,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilter: Boolean(filters.dateFrom || filters.dateTo || filters.projectId),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPermissionDenied: isPermissionError(query.error),
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل تقرير الأرباح والخسائر.') : '',
    refresh: query.refetch,
  }
}

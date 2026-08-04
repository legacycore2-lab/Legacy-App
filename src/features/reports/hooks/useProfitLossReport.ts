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
  // Draft (local) filters — not yet committed
  const [draftFilters, setDraftFilters] = useState<ProfitLossFilters>(EMPTY_FILTERS)
  // Committed filters — passed to queryFn only after Search press
  const [committedFilters, setCommittedFilters] = useState<ProfitLossFilters>(EMPTY_FILTERS)
  const [filtersDirty, setFiltersDirty] = useState(false)

  const query = useQuery({
    queryKey: ['reports', 'profit-loss', committedFilters],
    queryFn: () => loadProfitLossData(committedFilters),
    staleTime: 30_000,
    enabled,
  })

  function setDraftFilter<K extends keyof ProfitLossFilters>(key: K, value: ProfitLossFilters[K]) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
    setFiltersDirty(true)
  }

  function commitSearch() {
    setCommittedFilters(draftFilters)
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
    hasActiveFilter: Boolean(
      committedFilters.dateFrom || committedFilters.dateTo || committedFilters.projectId,
    ),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPermissionDenied: isPermissionError(query.error),
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل تقرير الأرباح والخسائر.') : '',
    refresh: query.refetch,
  }
}

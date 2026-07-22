import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getJournalPage, watchJournal } from '../services/journal.service'
import type { JournalFilters } from '../types/journal.types'

const PAGE_SIZE = 25

export function useJournal() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<JournalFilters>({ query: '', type: 'all' })
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(filters.query)
  const query = useQuery({
    queryKey: ['journal', page, deferredSearch, filters.type],
    queryFn: () =>
      getJournalPage({ page, pageSize: PAGE_SIZE, filters: { ...filters, query: deferredSearch } }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  useEffect(
    () => watchJournal(() => void queryClient.invalidateQueries({ queryKey: ['journal'] })),
    [queryClient],
  )

  const updateFilters = (nextFilters: JournalFilters) => {
    setPage(1)
    setFilters(nextFilters)
  }

  const result = query.data

  return {
    entries: result?.entries ?? [],
    summary: result?.summary ?? { totalCount: 0, pageIncome: 0, pageExpense: 0, pageNet: 0 },
    filters,
    onFiltersChange: updateFilters,
    page,
    totalPages: result?.totalPages ?? 1,
    onPreviousPage: () => setPage((current) => Math.max(1, current - 1)),
    onNextPage: () => setPage((current) => Math.min(result?.totalPages ?? current, current + 1)),
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل القيود حاليًا.') : '',
  }
}

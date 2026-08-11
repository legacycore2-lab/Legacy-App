import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getCashBankMovementsPage, MOVEMENTS_PAGE_SIZE } from '../services/cash-banks.service'
import type { CashBankMovementsFilters } from '../types/cash-banks.types'

export const defaultMovementsFilters: CashBankMovementsFilters = {
  accountId: '',
  type: 'all',
  dateFrom: '',
  dateTo: '',
  query: '',
}

export function useCashBankMovements() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<CashBankMovementsFilters>(defaultMovementsFilters)
  const [page, setPage] = useState(1)
  const deferredQuery = useDeferredValue(filters.query)

  const query = useQuery({
    queryKey: [
      'cash-banks',
      'movements',
      page,
      filters.accountId,
      filters.type,
      filters.dateFrom,
      filters.dateTo,
      deferredQuery,
    ],
    queryFn: () =>
      getCashBankMovementsPage({
        page,
        pageSize: MOVEMENTS_PAGE_SIZE,
        filters: { ...filters, query: deferredQuery },
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const updateFilters = (next: CashBankMovementsFilters) => {
    setPage(1)
    setFilters(next)
  }

  const resetFilters = () => {
    setPage(1)
    setFilters(defaultMovementsFilters)
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cash-banks', 'movements'] })

  return {
    movements: query.data?.movements ?? [],
    filters,
    onFiltersChange: updateFilters,
    onResetFilters: resetFilters,
    page,
    totalPages: query.data?.totalPages ?? 1,
    totalCount: query.data?.totalCount ?? 0,
    onPreviousPage: () => setPage((p) => Math.max(1, p - 1)),
    onNextPage: () => setPage((p) => Math.min(query.data?.totalPages ?? p, p + 1)),
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل سجل الحركات.') : '',
    invalidate,
  }
}

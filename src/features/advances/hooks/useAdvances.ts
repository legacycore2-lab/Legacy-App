import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  ADVANCES_PAGE_SIZE,
  createAdvance,
  getAdvanceOptions,
  getAdvancesMeta,
  getAdvancesPage,
  recordAdvanceExpense,
  returnAdvanceAmount,
} from '../services/advances.service'
import type {
  AdvanceFilters,
  AdvancesPageRequest,
  CreateAdvanceInput,
  RecordAdvanceExpenseInput,
  ReturnAdvanceInput,
} from '../types/advances.types'

export const defaultAdvanceFilters: AdvanceFilters = {
  search: '',
  status: 'all',
  project: 'all',
  dateFrom: '',
  dateTo: '',
}

const emptySummary = { openCount: 0, totalSpent: 0, totalRemaining: 0, overdueCount: 0 }

export function useAdvances() {
  const client = useQueryClient()
  const [filters, setFilters] = useState<AdvanceFilters>(defaultAdvanceFilters)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState('')

  const createRequestId = useRef(crypto.randomUUID())
  const expenseRequestId = useRef(crypto.randomUUID())
  const returnRequestId = useRef(crypto.randomUUID())

  const request: AdvancesPageRequest = { page, pageSize: ADVANCES_PAGE_SIZE, filters }

  const query = useQuery({
    queryKey: ['advances', 'page', page, filters],
    queryFn: () => getAdvancesPage(request),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const meta = useQuery({
    queryKey: ['advances', 'meta'],
    queryFn: getAdvancesMeta,
    staleTime: 60_000,
  })

  const options = useQuery({
    queryKey: ['advance-options'],
    queryFn: getAdvanceOptions,
    staleTime: 60_000,
  })

  const selectedAdvance = useMemo(
    () => query.data?.filteredAdvances.find((item) => item.id === selectedId) ?? query.data?.filteredAdvances[0],
    [query.data, selectedId],
  )

  const refresh = () => client.invalidateQueries({ queryKey: ['advances'] })

  const createMutation = useMutation({
    mutationFn: (input: CreateAdvanceInput) => createAdvance(input, createRequestId.current),
    onSuccess: () => {
      createRequestId.current = crypto.randomUUID()
      void refresh()
    },
  })

  const expenseMutation = useMutation({
    mutationFn: ({ input, remaining }: { input: RecordAdvanceExpenseInput; remaining: number }) =>
      recordAdvanceExpense(input, remaining, expenseRequestId.current),
    onSuccess: () => {
      expenseRequestId.current = crypto.randomUUID()
      void refresh()
    },
  })

  const returnMutation = useMutation({
    mutationFn: ({ input, remaining }: { input: ReturnAdvanceInput; remaining: number }) =>
      returnAdvanceAmount(input, remaining, returnRequestId.current),
    onSuccess: () => {
      returnRequestId.current = crypto.randomUUID()
      void refresh()
    },
  })

  const updateFilters = (next: AdvanceFilters) => {
    setPage(1)
    setSelectedId('')
    setFilters(next)
  }

  const resetFilters = () => {
    setPage(1)
    setSelectedId('')
    setFilters(defaultAdvanceFilters)
  }

  const previousPage = () => {
    setSelectedId('')
    setPage((current) => Math.max(1, current - 1))
  }

  const nextPage = () => {
    setSelectedId('')
    setPage((current) => Math.min(query.data?.totalPages ?? current, current + 1))
  }

  const actionError = createMutation.error ?? expenseMutation.error ?? returnMutation.error
  const loadError = query.error ?? meta.error

  return {
    data: query.data,
    summary: meta.data?.summary ?? emptySummary,
    projects: meta.data?.projects ?? [],
    options: options.data,
    filters,
    onFiltersChange: updateFilters,
    onResetFilters: resetFilters,
    selectedAdvance,
    selectedAdvanceId: selectedAdvance?.id ?? null,
    selectAdvance: setSelectedId,
    page,
    totalPages: query.data?.totalPages ?? 1,
    totalCount: query.data?.totalCount ?? 0,
    onPreviousPage: previousPage,
    onNextPage: nextPage,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: loadError ? toErrorMessage(loadError, 'تعذر تحميل بيانات العُهد والسلف.') : '',
    actionError: actionError ? toErrorMessage(actionError, 'تعذر حفظ الحركة.') : '',
    isSaving: createMutation.isPending || expenseMutation.isPending || returnMutation.isPending,
    createAdvance: createMutation.mutateAsync,
    recordExpense: expenseMutation.mutateAsync,
    returnAmount: returnMutation.mutateAsync,
  }
}

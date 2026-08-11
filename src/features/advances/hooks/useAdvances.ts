import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  ADVANCES_PAGE_SIZE,
  createAdvance,
  getAdvanceOptions,
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

export function useAdvances() {
  const client = useQueryClient()
  const [filters, setFilters] = useState<AdvanceFilters>(defaultAdvanceFilters)
  const [page, setPage] = useState(1)

  // ─── Idempotency: stable requestId per submit attempt ─────────────────────
  const createRequestId = useRef(crypto.randomUUID())
  const expenseRequestId = useRef(crypto.randomUUID())
  const returnRequestId = useRef(crypto.randomUUID())

  const request: AdvancesPageRequest = { page, pageSize: ADVANCES_PAGE_SIZE, filters }

  const query = useQuery({
    queryKey: ['advances', page, filters],
    queryFn: () => getAdvancesPage(request),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const options = useQuery({
    queryKey: ['advance-options'],
    queryFn: getAdvanceOptions,
    staleTime: 60_000,
  })

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
    setFilters(next)
  }

  const resetFilters = () => {
    setPage(1)
    setFilters(defaultAdvanceFilters)
  }

  const actionError = createMutation.error ?? expenseMutation.error ?? returnMutation.error

  return {
    data: query.data,
    options: options.data,
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
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل بيانات العُهد والسلف.') : '',
    actionError: actionError ? toErrorMessage(actionError, 'تعذر حفظ الحركة.') : '',
    isSaving: createMutation.isPending || expenseMutation.isPending || returnMutation.isPending,
    createAdvance: createMutation.mutateAsync,
    recordExpense: expenseMutation.mutateAsync,
    returnAmount: returnMutation.mutateAsync,
  }
}

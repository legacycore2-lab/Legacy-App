import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  createAdvance,
  getAdvanceOptions,
  getAdvancesViewModel,
  recordAdvanceExpense,
  returnAdvanceAmount,
} from '../services/advances.service'
import type {
  AdvanceFilters,
  CreateAdvanceInput,
  RecordAdvanceExpenseInput,
  ReturnAdvanceInput,
} from '../types/advances.types'

export function useAdvances(filters: AdvanceFilters) {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['advances', filters],
    queryFn: () => getAdvancesViewModel(filters),
    staleTime: 30_000,
  })
  const options = useQuery({ queryKey: ['advance-options'], queryFn: getAdvanceOptions, staleTime: 60_000 })
  const refresh = () => client.invalidateQueries({ queryKey: ['advances'] })
  const createMutation = useMutation({
    mutationFn: (input: CreateAdvanceInput) => createAdvance(input),
    onSuccess: refresh,
  })
  const expenseMutation = useMutation({
    mutationFn: ({ input, remaining }: { input: RecordAdvanceExpenseInput; remaining: number }) =>
      recordAdvanceExpense(input, remaining),
    onSuccess: refresh,
  })
  const returnMutation = useMutation({
    mutationFn: ({ input, remaining }: { input: ReturnAdvanceInput; remaining: number }) =>
      returnAdvanceAmount(input, remaining),
    onSuccess: refresh,
  })
  const actionError = createMutation.error ?? expenseMutation.error ?? returnMutation.error
  return {
    data: query.data,
    options: options.data,
    isLoading: query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل بيانات العُهد والسلف.') : '',
    actionError: actionError ? toErrorMessage(actionError, 'تعذر حفظ الحركة.') : '',
    isSaving: createMutation.isPending || expenseMutation.isPending || returnMutation.isPending,
    createAdvance: createMutation.mutateAsync,
    recordExpense: expenseMutation.mutateAsync,
    returnAmount: returnMutation.mutateAsync,
  }
}

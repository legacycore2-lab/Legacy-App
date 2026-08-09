import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getAdvancesViewModel } from '../services/advances.service'
import type { AdvanceFilters } from '../types/advances.types'

export function useAdvances(filters: AdvanceFilters) {
  const query = useQuery({
    queryKey: ['advances', filters],
    queryFn: () => getAdvancesViewModel(filters),
    staleTime: 30_000,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل بيانات العُهد والسلف.') : '',
  }
}

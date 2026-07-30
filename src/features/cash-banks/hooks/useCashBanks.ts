import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getCashBanksViewModel } from '../services/cash-banks.service'

const cashBanksQueryKey = ['cash-banks'] as const

export function useCashBanks() {
  const query = useQuery({
    queryKey: cashBanksQueryKey,
    queryFn: getCashBanksViewModel,
    staleTime: 30_000,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل بيانات الخزنة والبنوك.') : '',
  }
}

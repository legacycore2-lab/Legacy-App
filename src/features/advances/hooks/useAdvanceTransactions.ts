import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getAdvanceTransactionsPage } from '../services/advances.service'
import { useState } from 'react'

export function useAdvanceTransactions(advanceId: string | null) {
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['advance-transactions', advanceId, page],
    queryFn: () => getAdvanceTransactionsPage(advanceId!, page),
    enabled: Boolean(advanceId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  return {
    transactions: query.data?.transactions ?? [],
    page,
    totalPages: query.data?.totalPages ?? 1,
    totalCount: query.data?.totalCount ?? 0,
    onPreviousPage: () => setPage((p) => Math.max(1, p - 1)),
    onNextPage: () => setPage((p) => Math.min(query.data?.totalPages ?? p, p + 1)),
    isLoading: query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل سجل الحركات.') : '',
  }
}

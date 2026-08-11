import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getAdvanceTransactionsPage } from '../services/advances.service'

type HistoryPageState = {
  advanceId: string | null
  page: number
}

export function useAdvanceTransactions(advanceId: string | null) {
  const [pageState, setPageState] = useState<HistoryPageState>({ advanceId, page: 1 })
  const page = pageState.advanceId === advanceId ? pageState.page : 1

  const query = useQuery({
    queryKey: ['advance-transactions', advanceId, page],
    queryFn: () => getAdvanceTransactionsPage(advanceId!, page),
    enabled: Boolean(advanceId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const setPage = (nextPage: number) => setPageState({ advanceId, page: nextPage })

  return {
    transactions: query.data?.transactions ?? [],
    page,
    totalPages: query.data?.totalPages ?? 1,
    totalCount: query.data?.totalCount ?? 0,
    onPreviousPage: () => setPage(Math.max(1, page - 1)),
    onNextPage: () => setPage(Math.min(query.data?.totalPages ?? page, page + 1)),
    isLoading: query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل سجل الحركات.') : '',
  }
}

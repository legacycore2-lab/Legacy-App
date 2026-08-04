import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getAnalyticsViewModel } from '../services/reports.service'

export function useAnalytics() {
  const q = useQuery({
    queryKey: ['reports', 'analytics'],
    queryFn: getAnalyticsViewModel,
    staleTime: 30_000,
  })

  return {
    executive: q.data?.executive,
    insights: q.data?.insights ?? [],
    isLoading: q.isLoading,
    error: q.error ? toErrorMessage(q.error, 'تعذر تحميل التحليلات.') : '',
    refresh: q.refetch,
  }
}

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getDashboardData, watchDashboard } from '../services/dashboard.service'

const dashboardQueryKey = ['dashboard'] as const

export function useDashboard() {
  const queryClient = useQueryClient()
  const dashboardQuery = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboardData,
    staleTime: 30_000,
  })

  useEffect(
    () => watchDashboard(() => void queryClient.invalidateQueries({ queryKey: dashboardQueryKey })),
    [queryClient],
  )

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error ? toErrorMessage(dashboardQuery.error, 'تعذر تحميل لوحة التحكم.') : '',
  }
}

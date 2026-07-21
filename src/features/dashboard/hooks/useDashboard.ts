import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getDashboardData } from '../services/dashboard.service'

const dashboardQueryKey = ['dashboard'] as const

export function useDashboard() {
  const dashboardQuery = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboardData,
    staleTime: 30_000,
  })

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error ? toErrorMessage(dashboardQuery.error, 'تعذر تحميل لوحة التحكم.') : '',
  }
}

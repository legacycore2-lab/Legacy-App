import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getDashboardData } from '../services/dashboard.service'
import type { DashboardData } from '../types/dashboard.types'

const empty: DashboardData = { kpis: [], projects: [], entries: [], actions: [] }

export function useDashboard() {
  const result = useQuery({
    queryKey: ['dashboard'],
    queryFn:  getDashboardData,
    staleTime: 60_000,
  })

  return {
    data:      result.data ?? empty,
    isLoading: result.isLoading,
    error:     result.error ? toErrorMessage(result.error, 'تعذر تحميل لوحة التحكم.') : '',
  }
}

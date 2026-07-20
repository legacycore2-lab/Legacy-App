import { useEffect, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getDashboardData } from '../services/dashboard.service'
import type { DashboardData } from '../types/dashboard.types'

const empty: DashboardData = { kpis: [], projects: [], entries: [], actions: [], alerts: [] }

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(empty)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getDashboardData()
      .then((value) => active && setData(value))
      .catch((loadError) => active && setError(toErrorMessage(loadError, 'تعذر تحميل لوحة التحكم.')))
      .finally(() => active && setIsLoading(false))

    return () => {
      active = false
    }
  }, [])

  return { data, isLoading, error }
}

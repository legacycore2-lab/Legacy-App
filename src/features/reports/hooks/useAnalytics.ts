import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildJournalAnalyticsViewModel,
  buildSmartInsights,
  getAnalyticsData,
} from '../services/analytics.service'
import type { JournalAnalyticsFilters } from '../types'

const DEFAULT_FILTERS: JournalAnalyticsFilters = {
  dateFrom: '',
  dateTo: '',
  projectId: '',
  entryType: 'all',
  contractor: '',
  paymentMethod: '',
  query: '',
}

export function useAnalytics() {
  const [filters, setFilters] = useState<JournalAnalyticsFilters>(DEFAULT_FILTERS)

  const analyticsQuery = useQuery({
    queryKey: ['reports', 'analytics-v2'],
    queryFn: getAnalyticsData,
    staleTime: 30_000,
  })

  const { kpis, health, entries } = analyticsQuery.data ?? {
    kpis: null,
    health: [],
    entries: [],
    projects: [],
  }

  const journalViewModel = useMemo(
    () =>
      entries.length > 0
        ? buildJournalAnalyticsViewModel(entries, filters)
        : {
            rows: [],
            totals: { totalIncome: 0, totalExpense: 0, netProfit: 0, count: 0 },
            contractors: [],
            paymentMethods: [],
          },
    [entries, filters],
  )

  const insights = useMemo(() => buildSmartInsights(health ?? [], entries), [health, entries])

  const topProfitable = useMemo(() => [...(health ?? [])].sort((a, b) => b.net - a.net).slice(0, 5), [health])
  const topLoss = useMemo(
    () =>
      [...(health ?? [])]
        .filter((p) => p.net < 0)
        .sort((a, b) => a.net - b.net)
        .slice(0, 5),
    [health],
  )

  const projectOptions = useMemo(
    () =>
      (analyticsQuery.data?.projects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
      })),
    [analyticsQuery.data?.projects],
  )

  return {
    kpis,
    health: health ?? [],
    topProfitable,
    topLoss,
    journalViewModel,
    insights,
    projectOptions,
    filters,
    setFilters,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error ? toErrorMessage(analyticsQuery.error, 'تعذر تحميل بيانات التحليلات.') : '',
    refresh: analyticsQuery.refetch,
  }
}

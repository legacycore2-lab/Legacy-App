import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildReportsAnalytics,
  filterReportRows,
  getReportsViewModel,
  summarizeReportRows,
} from '../services/reports.service'

function resolveReportsError(error: unknown): string {
  if (!error) return ''
  return toErrorMessage(error, 'تعذر تحميل التقارير.')
}

export function useReports() {
  const [query, setQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [status, setStatus] = useState('all')

  const reportsQuery = useQuery({
    queryKey: ['reports', 'financial-summary'],
    queryFn: getReportsViewModel,
    staleTime: 30_000,
  })

  const allRows = reportsQuery.data?.rows ?? []
  const rows = filterReportRows(allRows, query, includeArchived, status)
  const summary = summarizeReportRows(rows)
  const analytics = buildReportsAnalytics(rows)
  const statusOptions = buildReportsAnalytics(
    filterReportRows(allRows, '', includeArchived, 'all'),
  ).statusOptions

  return {
    rows,
    summary,
    analytics,
    statusOptions,
    query,
    setQuery,
    status,
    setStatus,
    includeArchived,
    setIncludeArchived,
    isLoading: reportsQuery.isLoading,
    error: resolveReportsError(reportsQuery.error),
    refresh: reportsQuery.refetch,
  }
}

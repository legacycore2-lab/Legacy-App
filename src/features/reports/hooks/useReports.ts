import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
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

  const reportsQuery = useQuery({
    queryKey: ['reports', 'financial-summary'],
    queryFn: getReportsViewModel,
    staleTime: 30_000,
  })

  const rows = useMemo(
    () => filterReportRows(reportsQuery.data?.rows ?? [], query, includeArchived),
    [includeArchived, query, reportsQuery.data?.rows],
  )
  const summary = useMemo(() => summarizeReportRows(rows), [rows])

  return {
    rows,
    summary,
    query,
    setQuery,
    includeArchived,
    setIncludeArchived,
    isLoading: reportsQuery.isLoading,
    error: resolveReportsError(reportsQuery.error),
    refresh: reportsQuery.refetch,
  }
}

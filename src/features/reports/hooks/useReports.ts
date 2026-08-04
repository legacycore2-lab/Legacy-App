import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  filterReportRows,
  getReportsViewModel,
  summarizeReportRows,
} from '../services/reports.service'

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
    error: reportsQuery.error ? toErrorMessage(reportsQuery.error, 'تعذر تحميل التقارير.') : '',
    refresh: reportsQuery.refetch,
  }
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getReportsViewModel } from '../services/reports.service'

export function useReports() {
  const [query, setQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)

  const reportsQuery = useQuery({
    queryKey: ['reports', 'financial-summary'],
    queryFn: getReportsViewModel,
    staleTime: 30_000,
  })

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ar-EG')
    return (reportsQuery.data?.rows ?? []).filter((row) => {
      if (!includeArchived && row.isArchived) return false
      if (!normalized) return true
      return [row.name, row.code, row.client].some((value) =>
        value.toLocaleLowerCase('ar-EG').includes(normalized),
      )
    })
  }, [includeArchived, query, reportsQuery.data?.rows])

  return {
    rows,
    summary: reportsQuery.data?.summary,
    query,
    setQuery,
    includeArchived,
    setIncludeArchived,
    isLoading: reportsQuery.isLoading,
    error: reportsQuery.error ? toErrorMessage(reportsQuery.error, 'تعذر تحميل التقارير.') : '',
    refresh: reportsQuery.refetch,
  }
}

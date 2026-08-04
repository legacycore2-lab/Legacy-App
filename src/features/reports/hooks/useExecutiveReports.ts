import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildSmartInsights,
  filterReportRows,
  loadExecutiveData,
} from '../services/reports.service'
import type { ReportsTab } from '../types/report.types'

export function useExecutiveReports(activeTab: ReportsTab) {
  const [query, setQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const enabled = activeTab === 'executive' || activeTab === 'projects' || activeTab === 'insights'

  const q = useQuery({
    queryKey: ['reports', 'executive'],
    queryFn: loadExecutiveData,
    staleTime: 30_000,
    enabled,
  })

  const allRows = q.data?.rows ?? []

  const filteredRows = filterReportRows(
    statusFilter ? allRows.filter((r) => r.status === statusFilter) : allRows,
    query,
    includeArchived,
  )

  const insights = q.data ? buildSmartInsights(q.data.rows) : []

  return {
    summary: q.data?.summary,
    topProjects: q.data?.topProjects,
    allRows,
    filteredRows,
    insights,
    query,
    setQuery,
    includeArchived,
    setIncludeArchived,
    statusFilter,
    setStatusFilter,
    isLoading: q.isLoading,
    error: q.error ? toErrorMessage(q.error, 'تعذر تحميل بيانات التقارير.') : '',
    isPermissionError: false,
    refresh: q.refetch,
  }
}

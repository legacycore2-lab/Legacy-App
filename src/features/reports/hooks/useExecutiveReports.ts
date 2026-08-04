import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { isPermissionError, toErrorMessage } from '../../../shared/errors/app-error'
import { buildSmartInsights, filterReportRows, loadExecutiveData } from '../services/reports.service'
import type { ReportsTab } from '../types/report.types'

export function useExecutiveReports(activeTab: ReportsTab | null) {
  const enabled = activeTab === 'executive' || activeTab === 'projects' || activeTab === 'insights'

  // Local (draft) filter state — not submitted yet
  const [draftQuery, setDraftQuery] = useState('')
  const [draftIncludeArchived, setDraftIncludeArchived] = useState(false)
  const [draftStatusFilter, setDraftStatusFilter] = useState('')

  // Committed filter state — used for actual filtering after Search press
  const [query, setQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const [filtersDirty, setFiltersDirty] = useState(false)

  const q = useQuery({
    queryKey: ['reports', 'executive'],
    queryFn: loadExecutiveData,
    staleTime: 30_000,
    enabled,
  })

  const allRows = q.data?.rows ?? []
  const filteredRows = filterReportRows(allRows, query, includeArchived, statusFilter)
  const insights = q.data ? buildSmartInsights(q.data.rows) : []

  function handleDraftQueryChange(v: string) {
    setDraftQuery(v)
    setFiltersDirty(true)
  }

  function handleDraftIncludeArchivedChange(v: boolean) {
    setDraftIncludeArchived(v)
    setFiltersDirty(true)
  }

  function handleDraftStatusFilterChange(v: string) {
    setDraftStatusFilter(v)
    setFiltersDirty(true)
  }

  function commitSearch() {
    setQuery(draftQuery)
    setIncludeArchived(draftIncludeArchived)
    setStatusFilter(draftStatusFilter)
    setFiltersDirty(false)
  }

  function resetFilters() {
    setDraftQuery('')
    setDraftIncludeArchived(false)
    setDraftStatusFilter('')
    setFiltersDirty(false)
  }

  return {
    summary: q.data?.summary,
    topProjects: q.data?.topProjects,
    allRows,
    filteredRows,
    insights,
    // Draft (local) values for controlled inputs
    draftQuery,
    draftIncludeArchived,
    draftStatusFilter,
    setDraftQuery: handleDraftQueryChange,
    setDraftIncludeArchived: handleDraftIncludeArchivedChange,
    setDraftStatusFilter: handleDraftStatusFilterChange,
    // Search / reset actions
    commitSearch,
    resetFilters,
    filtersDirty,
    isLoading: q.isLoading,
    isPermissionDenied: isPermissionError(q.error),
    error: q.error ? toErrorMessage(q.error, 'تعذر تحميل بيانات التقارير.') : '',
    refresh: q.refetch,
  }
}

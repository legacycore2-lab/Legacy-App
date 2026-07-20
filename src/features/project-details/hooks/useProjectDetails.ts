import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getProjectDetails, getProjectEntriesPage } from '../services/project-details.service'
import type { ProjectEntryFilters } from '../types/project-details.types'

const PAGE_SIZE = 25

export function useProjectDetails(projectId: string) {
  const [filters, setFilters] = useState<ProjectEntryFilters>({ query: '', type: 'all' })
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(filters.query)

  const projectQuery = useQuery({
    queryKey: ['project-details', projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  })

  const entriesQuery = useQuery({
    queryKey: ['project-details', projectId, 'entries', page, deferredSearch, filters.type],
    queryFn: () =>
      getProjectEntriesPage({
        projectId,
        page,
        pageSize: PAGE_SIZE,
        filters: { ...filters, query: deferredSearch },
      }),
    enabled: Boolean(projectId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const updateFilters = (next: ProjectEntryFilters) => {
    setPage(1)
    setFilters(next)
  }

  const result = entriesQuery.data

  return {
    project: projectQuery.data ?? null,
    entries: result?.entries ?? [],
    summary: result?.summary ?? {
      totalCount: 0,
      pageIncome: 0,
      pageExpense: 0,
      pageNet: 0,
    },
    filters,
    onFiltersChange: updateFilters,
    page,
    totalPages: result?.totalPages ?? 1,
    onPreviousPage: () => setPage((current) => Math.max(1, current - 1)),
    onNextPage: () => setPage((current) => Math.min(result?.totalPages ?? current, current + 1)),
    isProjectLoading: projectQuery.isLoading,
    projectError: projectQuery.error
      ? toErrorMessage(projectQuery.error, 'تعذر تحميل بيانات المشروع.')
      : '',
    isLoading: entriesQuery.isLoading,
    isRefreshing: entriesQuery.isFetching && !entriesQuery.isLoading,
    error: entriesQuery.error
      ? toErrorMessage(entriesQuery.error, 'تعذر تحميل قيود المشروع حاليًا.')
      : '',
  }
}

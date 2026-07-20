import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getJournalPage, getJournalProject } from '../services/journal.service'
import type { JournalFilters } from '../types/journal.types'

const PAGE_SIZE = 25

export function useProjectJournal(projectId: string) {
  const [filters, setFilters] = useState<JournalFilters>({ query: '', type: 'all' })
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(filters.query)
  const projectQuery = useQuery({
    queryKey: ['journal', 'project-header', projectId],
    queryFn: () => getJournalProject(projectId),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  })
  const entriesQuery = useQuery({
    queryKey: ['journal', 'project', projectId, page, deferredSearch, filters.type],
    queryFn: () =>
      getJournalPage({
        page,
        pageSize: PAGE_SIZE,
        projectId,
        filters: { ...filters, query: deferredSearch },
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: Boolean(projectId),
  })

  const updateFilters = (nextFilters: JournalFilters) => {
    setPage(1)
    setFilters(nextFilters)
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
    projectError: projectQuery.error ? toErrorMessage(projectQuery.error, 'تعذر تحميل بيانات المشروع.') : '',
    isLoading: entriesQuery.isLoading,
    isRefreshing: entriesQuery.isFetching && !entriesQuery.isLoading,
    error: entriesQuery.error ? toErrorMessage(entriesQuery.error, 'تعذر تحميل قيود المشروع حاليًا.') : '',
  }
}

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getProjectsPage, PROJECTS_PAGE_SIZE } from '../services/project-list.service'
import { getProjects, summarizeProjects, watchProjects } from '../services/projects.service'
import type { ProjectStatusFilter } from '../types/project.types'

const projectsQueryKey = ['projects'] as const

export function useProjects() {
  const queryClient = useQueryClient()
  const [query, setQueryState] = useState('')
  const [status, setStatusState] = useState<ProjectStatusFilter>('all')
  const [page, setPage] = useState(1)
  const deferredQuery = useDeferredValue(query)

  const summaryQuery = useQuery({
    queryKey: [...projectsQueryKey, 'summary'],
    queryFn: getProjects,
    staleTime: 30_000,
  })

  const pageQuery = useQuery({
    queryKey: [...projectsQueryKey, 'page', page, deferredQuery, status],
    queryFn: () =>
      getProjectsPage({
        page,
        pageSize: PROJECTS_PAGE_SIZE,
        query: deferredQuery,
        status,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  useEffect(
    () => watchProjects(() => void queryClient.invalidateQueries({ queryKey: projectsQueryKey })),
    [queryClient],
  )

  useEffect(() => {
    if (pageQuery.data && pageQuery.data.page !== page) setPage(pageQuery.data.page)
  }, [page, pageQuery.data])

  const projects = useMemo(() => summaryQuery.data ?? [], [summaryQuery.data])
  const summary = useMemo(() => summarizeProjects(projects), [projects])

  const setQuery = (value: string) => {
    setQueryState(value)
    setPage(1)
  }

  const setStatus = (value: ProjectStatusFilter) => {
    setStatusState(value)
    setPage(1)
  }

  const error = pageQuery.error ?? summaryQuery.error

  return {
    projects,
    projectRows: pageQuery.data?.rows ?? [],
    summary,
    totalCount: pageQuery.data?.totalCount ?? 0,
    page,
    totalPages: pageQuery.data?.totalPages ?? 1,
    query,
    setQuery,
    status,
    setStatus,
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => Math.min(pageQuery.data?.totalPages ?? current, current + 1)),
    isLoading: pageQuery.isLoading || summaryQuery.isLoading,
    isRefreshing: pageQuery.isFetching && !pageQuery.isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل المشاريع.') : '',
  }
}

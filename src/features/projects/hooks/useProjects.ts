import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { filterProjects } from '../services/project-filter.service'
import { buildProjectRows, getProjects, summarizeProjects, watchProjects } from '../services/projects.service'
import type { ProjectStatusFilter } from '../types/project.types'

const projectsQueryKey = ['projects'] as const

export function useProjects() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')

  const projectsQuery = useQuery({
    queryKey: projectsQueryKey,
    queryFn: getProjects,
    staleTime: 30_000,
  })

  useEffect(
    () => watchProjects(() => void queryClient.invalidateQueries({ queryKey: projectsQueryKey })),
    [queryClient],
  )

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data])
  const filteredProjects = useMemo(() => filterProjects(projects, query, status), [projects, query, status])
  const summary = useMemo(() => summarizeProjects(projects), [projects])
  const projectRows = useMemo(() => buildProjectRows(filteredProjects), [filteredProjects])

  return {
    projects,
    projectRows,
    summary,
    query,
    setQuery,
    status,
    setStatus,
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error ? toErrorMessage(projectsQuery.error, 'تعذر تحميل المشاريع.') : '',
  }
}

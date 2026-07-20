import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { filterProjects } from '../services/project-filter.service'
import { buildProjectRows, getProjects, summarizeProjects } from '../services/projects.service'
import type { ProjectStatusFilter } from '../types/project.types'

export function useProjects() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')
  const result = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 60_000,
  })
  const projects = result.data ?? []
  const filteredProjects = useMemo(() => filterProjects(projects, query, status), [projects, query, status])
  const summary = useMemo(() => summarizeProjects(projects), [projects])
  const projectRows = useMemo(() => buildProjectRows(filteredProjects), [filteredProjects])
  const error = result.error ? toErrorMessage(result.error, 'تعذر تحميل المشاريع.') : ''

  return {
    projects,
    projectRows,
    summary,
    query,
    setQuery,
    status,
    setStatus,
    isLoading: result.isLoading,
    error,
  }
}

import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { buildProjectRows, getProjects, summarizeProjects } from '../services/projects.service'
import type { ProjectStatusFilter } from '../types/project.types'

export function useProjects() {
  const [query, setQuery]   = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')

  const result = useQuery({
    queryKey: ['projects', query, status],
    queryFn:  () => getProjects({ query, status }),
    staleTime: 30_000,
  })

  const projects    = result.data ?? []
  const summary     = useMemo(() => summarizeProjects(projects), [projects])
  const projectRows = useMemo(() => buildProjectRows(projects),  [projects])

  return {
    projects,
    projectRows,
    summary,
    query,
    setQuery,
    status,
    setStatus,
    isLoading: result.isLoading,
    error:     result.error ? toErrorMessage(result.error, 'تعذر تحميل المشاريع.') : '',
  }
}

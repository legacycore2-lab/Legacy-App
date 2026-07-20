import { useEffect, useMemo, useState } from 'react'
import { getProjects } from '../services/projects.service'
import type { Project, ProjectStatusFilter } from '../types/project.types'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { filterProjects } from '../services/project-filter.service'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getProjects()
      .then((data) => active && setProjects(data))
      .catch((loadError) => active && setError(toErrorMessage(loadError, 'تعذر تحميل المشاريع.')))
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])
  const filteredProjects = useMemo(() => filterProjects(projects, query, status), [projects, query, status])
  return { projects, filteredProjects, query, setQuery, status, setStatus, isLoading, error }
}

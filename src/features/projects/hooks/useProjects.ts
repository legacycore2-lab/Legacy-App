import { useEffect, useMemo, useState } from 'react'
import { getProjects } from '../services/projects.service'
import type { Project, ProjectStatusFilter } from '../types/project.types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; getProjects().then((data) => active && setProjects(data)).catch(() => active && setError('تعذر تحميل المشاريع.')).finally(() => active && setIsLoading(false)); return () => { active = false } }, [])
  const filteredProjects = useMemo(() => { const value = query.trim().toLocaleLowerCase('ar'); return projects.filter((project) => (status === 'all' || project.status === status) && (!value || [project.name, project.client, project.location, project.manager].some((field) => field.toLocaleLowerCase('ar').includes(value)))) }, [projects, query, status])
  return { projects, filteredProjects, query, setQuery, status, setStatus, isLoading, error }
}

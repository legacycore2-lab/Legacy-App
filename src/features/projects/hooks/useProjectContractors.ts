import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildProjectContractorsViewModel,
  getProjectContractors,
} from '../services/project-contractors.service'
import type { ProjectContractor, ProjectContractorsViewModel } from '../types/project-contractor.types'

function projectContractorsKey(projectId: string) {
  return ['project-contractors', projectId] as const
}

export function useProjectContractors(projectId: string | null): {
  viewModel: ProjectContractorsViewModel | null
  expandedKey: string | null
  toggleExpanded: (key: string) => void
  isLoading: boolean
  error: string
} {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: projectContractorsKey(projectId ?? ''),
    queryFn: () => getProjectContractors(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const viewModel: ProjectContractorsViewModel | null = data ? buildProjectContractorsViewModel(data) : null

  function toggleExpanded(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key))
  }

  return {
    viewModel,
    expandedKey,
    toggleExpanded,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل بيانات المقاولين.') : '',
  }
}

// Exported for testing — pure derivation without hook machinery
export function deriveExpandedContractor(
  contractors: ProjectContractor[],
  expandedKey: string | null,
): ProjectContractor | null {
  if (!expandedKey) return null
  return contractors.find((c) => c.key === expandedKey) ?? null
}

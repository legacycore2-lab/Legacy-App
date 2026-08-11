import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { watchProjectDetails } from '../services/project-details-realtime.service'
import {
  buildFinanceViewModel,
  buildProjectDetailsViewModel,
  buildProjectJournalViewModel,
  getProjectDetails,
} from '../services/projects.service'
import type {
  ProjectDetailsViewModel,
  ProjectFinanceViewModel,
  ProjectJournalViewModel,
} from '../types/project.types'

export function useProjectDetails(projectId: string | null): {
  viewModel: ProjectDetailsViewModel | null
  financeViewModel: ProjectFinanceViewModel | null
  journalViewModel: ProjectJournalViewModel | null
  isLoading: boolean
  error: string
} {
  const queryClient = useQueryClient()
  const queryKey = ['project-details', projectId] as const
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getProjectDetails(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!projectId) return

    return watchProjectDetails(() => {
      void queryClient.invalidateQueries({ queryKey })
    })
  }, [projectId, queryClient])

  return {
    viewModel: data ? buildProjectDetailsViewModel(data) : null,
    financeViewModel: data ? buildFinanceViewModel(data) : null,
    journalViewModel: data ? buildProjectJournalViewModel(data) : null,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل تفاصيل المشروع.') : '',
  }
}

import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
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
  const { data, isLoading, error } = useQuery({
    queryKey: ['project-details', projectId],
    queryFn: () => getProjectDetails(projectId!),
    enabled: !!projectId,
  })

  return {
    viewModel: data ? buildProjectDetailsViewModel(data) : null,
    financeViewModel: data ? buildFinanceViewModel(data) : null,
    journalViewModel: data ? buildProjectJournalViewModel(data) : null,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل تفاصيل المشروع.') : '',
  }
}

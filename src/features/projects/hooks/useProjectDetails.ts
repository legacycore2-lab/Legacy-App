import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getProjectDetails } from '../services/projects.service'

export function useProjectDetails(projectId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['project-details', projectId],
    queryFn: () => getProjectDetails(projectId!),
    enabled: !!projectId,
  })

  return {
    details: data ?? null,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل تفاصيل المشروع.') : '',
  }
}

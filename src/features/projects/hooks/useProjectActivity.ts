import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { formatLocalDateKey } from '../../../shared/date-utils'
import { isPermissionError, toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildActivityViewModel,
  getActivityAttachmentSignedUrl,
  getProjectActivityData,
} from '../services/project-activity.service'
import type { ActivityFilter, ProjectActivityViewModel } from '../types/project-activity.types'

function activityKey(projectId: string) {
  return ['project-activity', projectId] as const
}

export function useProjectActivity(projectId: string | null): {
  viewModel: ProjectActivityViewModel | null
  filter: ActivityFilter
  setFilter: (f: ActivityFilter) => void
  isLoading: boolean
  error: string
  isPermissionDenied: boolean
} {
  const [filter, setFilter] = useState<ActivityFilter>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: activityKey(projectId ?? ''),
    queryFn: () => getProjectActivityData(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const viewModel: ProjectActivityViewModel | null = data
    ? data.projectRecord
      ? buildActivityViewModel(
          data.projectRecord,
          data.entryRecords,
          data.attachmentRecords,
          filter,
          formatLocalDateKey(),
        )
      : { groups: [], totalCount: 0, hasActivity: false }
    : null

  return {
    viewModel,
    filter,
    setFilter,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل سجل النشاط.') : '',
    isPermissionDenied: isPermissionError(error),
  }
}

export function useActivityAttachmentUrl() {
  const mutation = useMutation({
    mutationFn: (storagePath: string) => getActivityAttachmentSignedUrl(storagePath),
  })

  return {
    getUrl: mutation.mutateAsync,
    isLoading: mutation.isPending,
  }
}

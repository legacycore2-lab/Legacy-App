import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildActivityViewModel,
  getActivityAttachmentSignedUrl,
  getProjectActivityData,
} from '../services/project-activity.service'
import type { ActivityFilter, ProjectActivityViewModel } from '../types/project-activity.types'

function activityKey(projectId: string) {
  return ['project-activity', projectId] as const
}

/**
 * Returns today's date as "YYYY-MM-DD" using the *local* calendar date.
 *
 * Rationale: "اليوم" / "أمس" labels should reflect the user's wall-clock day,
 * not the UTC day. A user at UTC+3 at 01:00 local time is still "today" for
 * them even though UTC is the previous day.
 *
 * Entry dates (entry_date) are still parsed without timezone shift in the
 * service layer — that logic is independent and unaffected by this change.
 */
function todayLocalKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useProjectActivity(projectId: string | null): {
  viewModel: ProjectActivityViewModel | null
  filter: ActivityFilter
  setFilter: (f: ActivityFilter) => void
  isLoading: boolean
  error: string
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
          todayLocalKey(),
        )
      : { groups: [], totalCount: 0, hasActivity: false }
    : null

  return {
    viewModel,
    filter,
    setFilter,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل سجل النشاط.') : '',
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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { forceDeleteEntry } from '../services/journal-entry.service'

export function useJournalActions() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['journal'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])

  const forceDeleteMutation = useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason: string }) =>
      forceDeleteEntry(entryId, reason),
    onSuccess: invalidate,
  })

  return {
    forceDeleteEntry: (entryId: string, reason: string) =>
      forceDeleteMutation.mutateAsync({ entryId, reason }),
    isForceDeleting: forceDeleteMutation.isPending,
    forceDeleteError: forceDeleteMutation.error
      ? toErrorMessage(forceDeleteMutation.error, 'تعذر حذف القيد نهائيًا.')
      : '',
  }
}

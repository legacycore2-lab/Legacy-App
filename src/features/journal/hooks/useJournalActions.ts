import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { forceDeleteEntry, reverseEntry } from '../services/journal-entry.service'

export function useJournalActions() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['journal'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['contractors'] }),
      queryClient.invalidateQueries({ queryKey: ['project-details'] }),
      queryClient.invalidateQueries({ queryKey: ['project-activity'] }),
      queryClient.invalidateQueries({ queryKey: ['project-contractors'] }),
      queryClient.invalidateQueries({ queryKey: ['cash-banks'] }),
    ])

  const reverseMutation = useMutation({
    mutationFn: (entryId: string) => reverseEntry(entryId),
    onSuccess: invalidate,
  })

  const forceDeleteMutation = useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason: string }) =>
      forceDeleteEntry(entryId, reason),
    onSuccess: invalidate,
  })

  return {
    reverseEntry: (entryId: string) => reverseMutation.mutateAsync(entryId),
    isReversing: reverseMutation.isPending,
    reverseError: reverseMutation.error ? toErrorMessage(reverseMutation.error, 'تعذر عكس القيد.') : '',
    forceDeleteEntry: (entryId: string, reason: string) =>
      forceDeleteMutation.mutateAsync({ entryId, reason }),
    isForceDeleting: forceDeleteMutation.isPending,
    forceDeleteError: forceDeleteMutation.error
      ? toErrorMessage(forceDeleteMutation.error, 'تعذر حذف القيد نهائيًا.')
      : '',
  }
}

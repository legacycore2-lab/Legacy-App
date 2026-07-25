import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { permanentlyRemoveJournalEntry, removeJournalEntry } from '../services/journal-entry.service'

export function useJournalActions() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['journal'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => removeJournalEntry(entryId),
    onSuccess: invalidate,
  })

  const forceDeleteMutation = useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason: string }) =>
      permanentlyRemoveJournalEntry(entryId, reason),
    onSuccess: invalidate,
  })

  return {
    deleteEntry: (entryId: string) => deleteMutation.mutateAsync(entryId),
    forceDeleteEntry: (entryId: string, reason: string) =>
      forceDeleteMutation.mutateAsync({ entryId, reason }),
    isDeleting: deleteMutation.isPending,
    isForceDeleting: forceDeleteMutation.isPending,
    deleteError: deleteMutation.error ? toErrorMessage(deleteMutation.error, 'تعذر حذف القيد.') : '',
    forceDeleteError: forceDeleteMutation.error
      ? toErrorMessage(forceDeleteMutation.error, 'تعذر حذف القيد نهائيًا.')
      : '',
  }
}

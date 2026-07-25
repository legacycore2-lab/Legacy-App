import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { removeJournalEntry, editJournalEntry } from '../services/journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

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

  const updateMutation = useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: SingleLineJournalInput }) =>
      editJournalEntry(entryId, input),
    onSuccess: invalidate,
  })

  return {
    deleteEntry: (entryId: string) => deleteMutation.mutateAsync(entryId),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error ? toErrorMessage(deleteMutation.error, 'تعذر حذف القيد.') : '',

    updateEntry: (entryId: string, input: SingleLineJournalInput) =>
      updateMutation.mutateAsync({ entryId, input }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error ? toErrorMessage(updateMutation.error, 'تعذر تعديل القيد.') : '',
  }
}

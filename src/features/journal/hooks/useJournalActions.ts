import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { removeJournalEntry } from '../services/journal-entry.service'

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

  return {
    deleteEntry: (entryId: string) => deleteMutation.mutateAsync(entryId),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error ? toErrorMessage(deleteMutation.error, 'تعذر حذف القيد.') : '',
  }
}

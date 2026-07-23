import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { deleteEntry } from '../services/journal.service'

export function useDeleteEntry(onSuccess: () => void) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (entryId: string) => deleteEntry(entryId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['journal'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      onSuccess()
    },
  })

  return {
    deleteEntry: (entryId: string) => mutation.mutate(entryId),
    isDeleting: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'تعذر حذف القيد.') : '',
  }
}

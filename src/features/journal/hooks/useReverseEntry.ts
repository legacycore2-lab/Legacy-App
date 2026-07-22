import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { reverseEntry } from '../services/journal.service'

export function useReverseEntry(onSuccess: () => void) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (sourceEntryId: string) => reverseEntry(sourceEntryId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['journal'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      onSuccess()
    },
  })

  return {
    reverse: (sourceEntryId: string) => mutation.mutate(sourceEntryId),
    isReversing: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'تعذر عكس القيد.') : '',
  }
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getSystemSettings, saveSystemSettings } from '../services/settings.service'

export function useSettings() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['system-settings'], queryFn: getSystemSettings })
  const mutation = useMutation({
    mutationFn: saveSystemSettings,
    onSuccess: () => client.invalidateQueries({ queryKey: ['system-settings'] }),
  })
  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error
      ? toErrorMessage(query.error, 'تعذر تحميل الإعدادات.')
      : mutation.error
        ? toErrorMessage(mutation.error, 'تعذر حفظ الإعدادات.')
        : '',
    isSaving: mutation.isPending,
    save: mutation.mutateAsync,
  }
}

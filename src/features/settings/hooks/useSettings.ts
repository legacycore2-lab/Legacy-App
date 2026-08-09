import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  getSettingsAudit,
  getSystemSettings,
  saveCompanyLogo,
  saveSystemSettings,
} from '../services/settings.service'

export function useSettings() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['system-settings'], queryFn: getSystemSettings })
  const audit = useQuery({ queryKey: ['settings-audit'], queryFn: getSettingsAudit })
  const saveMutation = useMutation({
    mutationFn: saveSystemSettings,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['system-settings'] }),
        client.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]),
  })
  const logoMutation = useMutation({ mutationFn: saveCompanyLogo })
  const failure = query.error ?? saveMutation.error ?? logoMutation.error
  return {
    settings: query.data,
    audit: audit.data ?? [],
    isLoading: query.isLoading,
    error: failure ? toErrorMessage(failure, 'تعذر تنفيذ العملية.') : '',
    isSaving: saveMutation.isPending || logoMutation.isPending,
    save: saveMutation.mutateAsync,
    uploadLogo: logoMutation.mutateAsync,
  }
}

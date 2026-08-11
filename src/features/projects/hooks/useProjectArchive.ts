import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { archiveProject } from '../services/project-archive.service'
import { useProjectPermissions } from './useProjectPermissions'

export function useProjectArchive(projectId: string | null) {
  const queryClient = useQueryClient()
  const { canArchive } = useProjectPermissions()
  const [isOpen, setIsOpen] = useState(false)
  const mutation = useMutation({
    mutationFn: async () => {
      if (!canArchive) throw new Error('Project archive is not allowed for this role.')
      if (!projectId) throw new Error('Project identifier is missing.')
      return archiveProject(projectId)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['project-details', projectId] }),
      ])
    },
  })

  return {
    isOpen,
    open: () => {
      if (!canArchive) return
      mutation.reset()
      setIsOpen(true)
    },
    close: () => {
      if (!mutation.isPending) setIsOpen(false)
    },
    isArchiving: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'تعذر أرشفة المشروع.') : '',
    submit: async () => {
      if (!canArchive || mutation.isPending) return false
      return mutation
        .mutateAsync()
        .then(() => true)
        .catch(() => false)
    },
  }
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { deleteProject } from '../services/project-delete.service'
import { useProjectPermissions } from './useProjectPermissions'

export function useProjectDelete(projectId: string | null, projectName: string) {
  const queryClient = useQueryClient()
  const { canDelete: canDeleteProject } = useProjectPermissions()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!canDeleteProject) throw new Error('Project delete is not allowed for this role.')
      if (!projectId) throw new Error('Project identifier is missing.')
      await deleteProject(projectId)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.removeQueries({ queryKey: ['project-details', projectId] }),
        queryClient.removeQueries({ queryKey: ['project-activity', projectId] }),
        queryClient.removeQueries({ queryKey: ['project-attachments', projectId] }),
        queryClient.removeQueries({ queryKey: ['project-contractors', projectId] }),
      ])
    },
  })

  const close = () => {
    if (mutation.isPending) return
    setIsOpen(false)
    setConfirmation('')
    mutation.reset()
  }

  return {
    isOpen,
    open: () => {
      if (!canDeleteProject) return
      mutation.reset()
      setConfirmation('')
      setIsOpen(true)
    },
    close,
    confirmation,
    setConfirmation,
    canDelete:
      canDeleteProject && confirmation.trim() === projectName.trim() && !mutation.isPending,
    isDeleting: mutation.isPending,
    isDeleted: mutation.isSuccess,
    error: mutation.error ? toErrorMessage(mutation.error, 'تعذر حذف المشروع.') : '',
    submit: async () => {
      if (
        !canDeleteProject ||
        confirmation.trim() !== projectName.trim() ||
        mutation.isPending
      ) {
        return false
      }
      return mutation
        .mutateAsync()
        .then(() => true)
        .catch(() => false)
    },
  }
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { archiveProject } from '../services/project-archive.service'

export function useProjectArchive(projectId: string | null) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const mutation = useMutation({
    mutationFn: async () => {
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
      mutation.reset()
      setIsOpen(true)
    },
    close: () => {
      if (!mutation.isPending) setIsOpen(false)
    },
    isArchiving: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'تعذر أرشفة المشروع.') : '',
    submit: async () =>
      mutation
        .mutateAsync()
        .then(() => true)
        .catch(() => false),
  }
}

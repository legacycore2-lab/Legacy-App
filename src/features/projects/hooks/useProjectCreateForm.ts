import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { buildProjectCreatePreview, createProject, validateProjectCreateInput } from '../services/project-create.service'
import type { ProjectCreateFormState, ProjectCreateInput } from '../types/project-create.types'

function createInitialValue(): ProjectCreateInput {
  return {
    name: '',
    code: '',
    client: '',
    location: '',
    manager: '',
    status: 'active',
    contractValue: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    notes: '',
  }
}

export function useProjectCreateForm(): ProjectCreateFormState {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(createInitialValue)
  const [submitted, setSubmitted] = useState(false)
  const errors = useMemo(() => validateProjectCreateInput(value), [value])
  const preview = useMemo(() => buildProjectCreatePreview(value), [value])

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsOpen(false)
      setSubmitted(false)
      setValue(createInitialValue())
    },
  })

  const update = <K extends keyof ProjectCreateInput>(key: K, next: ProjectCreateInput[K]) => {
    createMutation.reset()
    setValue((current) => ({ ...current, [key]: next }))
  }

  const close = () => {
    if (createMutation.isPending) return

    setIsOpen(false)
    setSubmitted(false)
    setValue(createInitialValue())
    createMutation.reset()
  }

  const submit = async () => {
    setSubmitted(true)
    if (errors.length > 0 || !preview || createMutation.isPending) return

    await createMutation.mutateAsync(value).catch(() => undefined)
  }

  return {
    isOpen,
    open: () => {
      createMutation.reset()
      setIsOpen(true)
    },
    close,
    value,
    update,
    submitted,
    errors,
    preview,
    isSaving: createMutation.isPending,
    saveError: createMutation.error ? toErrorMessage(createMutation.error, 'تعذر إنشاء المشروع.') : '',
    submit,
  }
}

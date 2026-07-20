import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { hasProjectFormErrors, validateProjectForm } from '../services/project-form.service'
import { createProject } from '../services/projects.service'
import type { ProjectFormErrors, ProjectFormValues } from '../types/project-form.types'

const initialValues: ProjectFormValues = {
  name: '',
  clientName: '',
  startDate: '',
  closeDate: '',
  progress: 0,
}

export function useProjectForm(onSuccess: () => void) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ProjectFormValues>(initialValues)
  const [errors, setErrors] = useState<ProjectFormErrors>({})
  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      setValues(initialValues)
      setErrors({})
      onSuccess()
    },
  })

  function updateValue<Key extends keyof ProjectFormValues>(key: Key, value: ProjectFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function submit() {
    const nextErrors = validateProjectForm(values)
    setErrors(nextErrors)
    if (hasProjectFormErrors(nextErrors)) return
    mutation.mutate(values)
  }

  return {
    values,
    errors,
    updateValue,
    submit,
    isSaving: mutation.isPending,
    saveError: mutation.error ? toErrorMessage(mutation.error, 'تعذر حفظ المشروع.') : '',
  }
}

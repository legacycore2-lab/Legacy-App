import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildProjectCreatePreview,
  saveProject,
  validateProjectCreateInput,
} from '../services/project-create.service'
import type { Project } from '../types/project.types'
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
  const submissionInProgressRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(createInitialValue)
  const [submitted, setSubmitted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const errors = useMemo(() => validateProjectCreateInput(value), [value])
  const preview = useMemo(() => buildProjectCreatePreview(value), [value])

  const createMutation = useMutation({
    mutationFn: ({ input, projectId }: { input: ProjectCreateInput; projectId?: string }) =>
      saveProject(input, projectId),
    onSuccess: async (_project, variables) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]
      if (variables.projectId) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: ['project-details', variables.projectId] }),
        )
      }
      await Promise.all(invalidations)
      setIsOpen(false)
      setSubmitted(false)
      setEditingId(null)
      setValue(createInitialValue())
    },
  })

  const update = <K extends keyof ProjectCreateInput>(key: K, next: ProjectCreateInput[K]) => {
    createMutation.reset()
    setValue((current) => ({ ...current, [key]: next }))
  }

  const close = () => {
    if (createMutation.isPending || submissionInProgressRef.current) return

    setIsOpen(false)
    setSubmitted(false)
    setEditingId(null)
    setValue(createInitialValue())
    createMutation.reset()
  }

  const submit = async () => {
    if (submissionInProgressRef.current || createMutation.isPending) return

    setSubmitted(true)
    if (errors.length > 0 || !preview) return

    submissionInProgressRef.current = true
    try {
      await createMutation.mutateAsync({ input: value, projectId: editingId ?? undefined })
    } catch {
      // mutation error is exposed below for the form UI
    } finally {
      submissionInProgressRef.current = false
    }
  }

  return {
    isOpen,
    isEditing: editingId !== null,
    open: () => {
      createMutation.reset()
      setEditingId(null)
      setValue(createInitialValue())
      setIsOpen(true)
    },
    edit: (project: Project) => {
      if (project.status === 'archived') return

      createMutation.reset()
      setSubmitted(false)
      setEditingId(project.id)
      setValue({
        name: project.name,
        code: project.code,
        client: project.client,
        location: project.location,
        manager: project.manager,
        status: project.status,
        contractValue: String(project.contractValue),
        startDate: project.startDate,
        endDate: project.endDate,
        notes: project.notes,
      })
      setIsOpen(true)
    },
    close,
    value,
    update,
    submitted,
    errors,
    preview,
    isSaving: createMutation.isPending,
    saveError: createMutation.error
      ? toErrorMessage(createMutation.error, editingId ? 'تعذر تعديل المشروع.' : 'تعذر إنشاء المشروع.')
      : '',
    submit,
  }
}

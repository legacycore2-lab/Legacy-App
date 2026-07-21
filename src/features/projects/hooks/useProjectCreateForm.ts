import { useMemo, useState } from 'react'
import { buildProjectCreatePreview, validateProjectCreateInput } from '../services/project-create.service'
import type { ProjectCreateFormState, ProjectCreateInput } from '../types/project-create.types'

const initialValue: ProjectCreateInput = {
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

export function useProjectCreateForm(): ProjectCreateFormState {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [submitted, setSubmitted] = useState(false)
  const errors = useMemo(() => validateProjectCreateInput(value), [value])
  const preview = useMemo(() => buildProjectCreatePreview(value), [value])

  const update = <K extends keyof ProjectCreateInput>(key: K, next: ProjectCreateInput[K]) =>
    setValue((current) => ({ ...current, [key]: next }))

  const close = () => {
    setIsOpen(false)
    setSubmitted(false)
    setValue(initialValue)
  }

  return {
    isOpen,
    open: () => setIsOpen(true),
    close,
    value,
    update,
    submitted,
    errors,
    preview,
    review: () => setSubmitted(true),
  }
}

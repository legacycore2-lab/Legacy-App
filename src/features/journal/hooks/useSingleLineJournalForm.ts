import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildJournalPreview,
  submitSingleLineEntry,
  validateSingleLineEntry,
} from '../services/journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

function createInitialValue(): SingleLineJournalInput {
  return {
    entryDate: new Date().toISOString().slice(0, 10),
    projectName: '',
    type: 'expense',
    category: '',
    description: '',
    contractor: '',
    paymentAccount: '',
    amount: '',
  }
}

export function useSingleLineJournalForm() {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(createInitialValue)
  const [submitted, setSubmitted] = useState(false)
  const errors = useMemo(() => validateSingleLineEntry(value), [value])
  const preview = useMemo(() => buildJournalPreview(value), [value])
  const mutation = useMutation({
    mutationFn: submitSingleLineEntry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['journal'] })
    },
  })

  const update = <K extends keyof SingleLineJournalInput>(key: K, nextValue: SingleLineJournalInput[K]) =>
    setValue((current) => ({ ...current, [key]: nextValue }))

  const submit = async (): Promise<boolean> => {
    setSubmitted(true)
    if (errors.length > 0) return false

    try {
      await mutation.mutateAsync(value)
      setValue(createInitialValue())
      setSubmitted(false)
      return true
    } catch {
      return false
    }
  }

  return {
    value,
    submitted,
    errors,
    preview,
    update,
    submit,
    isSaving: mutation.isPending,
    saveError: mutation.error ? toErrorMessage(mutation.error, 'تعذر حفظ القيد.') : '',
  }
}

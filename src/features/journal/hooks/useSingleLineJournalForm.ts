import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { formatLocalDateInput } from '../../../shared/date/local-date'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildJournalPreview,
  submitSingleLineEntry,
  validateSingleLineEntry,
} from '../services/journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

function createInitialValue(): SingleLineJournalInput {
  return {
    entryDate: formatLocalDateInput(),
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
  const isSubmittingRef = useRef(false)
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
    if (isSubmittingRef.current || mutation.isPending) return false

    setSubmitted(true)
    if (errors.length > 0) return false

    isSubmittingRef.current = true
    try {
      await mutation.mutateAsync(value)
      setValue(createInitialValue())
      setSubmitted(false)
      return true
    } catch {
      return false
    } finally {
      isSubmittingRef.current = false
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

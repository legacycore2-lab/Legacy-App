import { useMemo, useState } from 'react'
import { buildJournalPreview, validateSingleLineEntry } from '../services/journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

const initialValue: SingleLineJournalInput = {
  entryDate: new Date().toISOString().slice(0, 10),
  projectName: '',
  type: 'expense',
  category: '',
  description: '',
  contractor: '',
  paymentAccount: '',
  amount: '',
}

export function useSingleLineJournalForm() {
  const [value, setValue] = useState(initialValue)
  const [submitted, setSubmitted] = useState(false)
  const errors = useMemo(() => validateSingleLineEntry(value), [value])
  const preview = useMemo(() => buildJournalPreview(value), [value])

  const update = <K extends keyof SingleLineJournalInput>(key: K, nextValue: SingleLineJournalInput[K]) =>
    setValue((current) => ({ ...current, [key]: nextValue }))

  const submit = () => setSubmitted(true)

  return { value, submitted, errors, preview, update, submit }
}

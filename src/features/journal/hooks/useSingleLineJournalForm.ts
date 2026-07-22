import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildJournalPreview,
  getLocalDateInputValue,
  getJournalPostingOptions,
  submitSingleLineEntry,
  validateSingleLineEntry,
} from '../services/journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

function createInitialValue(): SingleLineJournalInput {
  return {
    requestId: crypto.randomUUID(),
    entryDate: getLocalDateInputValue(),
    projectId: '',
    projectName: '',
    type: 'expense',
    categoryAccountId: '',
    category: '',
    description: '',
    contractor: '',
    paymentAccountId: '',
    paymentAccount: '',
    amount: '',
  }
}

export function useSingleLineJournalForm() {
  const queryClient = useQueryClient()
  const submissionInProgressRef = useRef(false)
  const [value, setValue] = useState(createInitialValue)
  const [submitted, setSubmitted] = useState(false)
  const optionsQuery = useQuery({
    queryKey: ['journal', 'posting-options'],
    queryFn: getJournalPostingOptions,
    staleTime: 60_000,
  })
  const errors = useMemo(() => validateSingleLineEntry(value), [value])
  const preview = useMemo(() => buildJournalPreview(value), [value])
  const mutation = useMutation({
    mutationFn: submitSingleLineEntry,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['journal'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  const update = <K extends keyof SingleLineJournalInput>(key: K, nextValue: SingleLineJournalInput[K]) =>
    setValue((current) => ({ ...current, [key]: nextValue }))

  const projects = optionsQuery.data?.projects ?? []
  const categoryAccounts = (optionsQuery.data?.accounts ?? []).filter((account) =>
    value.type === 'expense' ? account.accountType === 'expense' : account.accountType === 'revenue',
  )
  const paymentAccounts = (optionsQuery.data?.accounts ?? []).filter(
    (account) => account.accountType === 'asset',
  )

  const selectProject = (id: string) => {
    const project = projects.find((option) => option.id === id)
    setValue((current) => ({ ...current, projectId: id, projectName: project?.name ?? '' }))
  }

  const selectCategoryAccount = (id: string) => {
    const account = categoryAccounts.find((option) => option.id === id)
    setValue((current) => ({ ...current, categoryAccountId: id, category: account?.name ?? '' }))
  }

  const selectPaymentAccount = (id: string) => {
    const account = paymentAccounts.find((option) => option.id === id)
    setValue((current) => ({ ...current, paymentAccountId: id, paymentAccount: account?.name ?? '' }))
  }

  const selectType = (type: SingleLineJournalInput['type']) => {
    setValue((current) => ({
      ...current,
      type,
      categoryAccountId: '',
      category: '',
    }))
  }

  const submit = async (): Promise<boolean> => {
    if (submissionInProgressRef.current || mutation.isPending) return false

    setSubmitted(true)
    if (errors.length > 0) return false

    submissionInProgressRef.current = true
    try {
      await mutation.mutateAsync(value)
      setValue(createInitialValue())
      setSubmitted(false)
      return true
    } catch {
      return false
    } finally {
      submissionInProgressRef.current = false
    }
  }

  return {
    value,
    submitted,
    errors,
    preview,
    update,
    selectProject,
    selectCategoryAccount,
    selectPaymentAccount,
    selectType,
    projects,
    categoryAccounts,
    paymentAccounts,
    isLoadingOptions: optionsQuery.isLoading,
    optionsError: optionsQuery.error ? toErrorMessage(optionsQuery.error, 'تعذر تحميل خيارات القيد.') : '',
    submit,
    isSaving: mutation.isPending,
    saveError: mutation.error ? toErrorMessage(mutation.error, 'تعذر حفظ القيد.') : '',
  }
}

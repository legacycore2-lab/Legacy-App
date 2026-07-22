import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildJournalPreview,
  getJournalPostingOptions,
  submitSingleLineEntry,
  validateSingleLineEntry,
} from '../services/journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

function createInitialValue(): SingleLineJournalInput {
  return {
    requestId: crypto.randomUUID(),
    entryDate: new Date().toISOString().slice(0, 10),
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
      await queryClient.invalidateQueries({ queryKey: ['journal'] })
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildJournalPreview,
  editJournalEntry,
  getJournalPostingOptions,
  validateSingleLineEntry,
  watchJournalPostingOptions,
} from '../services/journal-entry.service'
import type { JournalPostingOptions, SingleLineJournalInput } from '../types/journal-entry.types'
import type { JournalEntry } from '../types/journal.types'

function resolveIds(
  entry: JournalEntry,
  options: JournalPostingOptions | undefined,
): Pick<SingleLineJournalInput, 'projectId' | 'categoryAccountId' | 'paymentAccountId'> {
  if (!options) return { projectId: '', categoryAccountId: '', paymentAccountId: '' }
  const projectId = options.projects.find((p) => p.name === entry.projectName)?.id ?? ''
  const categoryAccountId =
    options.accounts.find(
      (a) => a.name === entry.category || `${a.code} - ${a.name}` === entry.category,
    )?.id ?? ''
  const paymentAccountId =
    options.accounts.find(
      (a) => a.name === entry.paymentMethod || `${a.code} - ${a.name}` === entry.paymentMethod,
    )?.id ?? ''
  return { projectId, categoryAccountId, paymentAccountId }
}

type LocalOverrides = Partial<Pick<SingleLineJournalInput, 'projectId' | 'projectName' | 'categoryAccountId' | 'category' | 'paymentAccountId' | 'paymentAccount' | 'type'>>

export function useEditJournalForm(entry: JournalEntry) {
  const queryClient = useQueryClient()
  const submissionInProgressRef = useRef(false)
  const [overrides, setOverrides] = useState<LocalOverrides>({})
  const [fields, setFields] = useState({
    entryDate: entry.entryDate,
    description: entry.description,
    contractor: entry.contractor ?? '',
    amount: String(entry.amount),
  })
  const [submitted, setSubmitted] = useState(false)

  const optionsQuery = useQuery({
    queryKey: ['journal', 'posting-options'],
    queryFn: getJournalPostingOptions,
    staleTime: 60_000,
  })

  useEffect(
    () =>
      watchJournalPostingOptions(
        () => void queryClient.invalidateQueries({ queryKey: ['journal', 'posting-options'] }),
      ),
    [queryClient],
  )

  // الـ IDs بتتحسب من الـ options — مش state، مش effect
  const resolvedIds = useMemo(
    () => resolveIds(entry, optionsQuery.data),
    [entry, optionsQuery.data],
  )

  // القيمة النهائية = resolved IDs + overrides من المستخدم + باقي الحقول
  const value: SingleLineJournalInput = useMemo(
    () => ({
      requestId: entry.id,
      entryDate: fields.entryDate,
      projectId: overrides.projectId ?? resolvedIds.projectId,
      projectName: overrides.projectName ?? entry.projectName,
      type: overrides.type ?? entry.type,
      categoryAccountId: overrides.categoryAccountId ?? resolvedIds.categoryAccountId,
      category: overrides.category ?? entry.category,
      description: fields.description,
      contractor: fields.contractor,
      paymentAccountId: overrides.paymentAccountId ?? resolvedIds.paymentAccountId,
      paymentAccount: overrides.paymentAccount ?? entry.paymentMethod ?? '',
      amount: fields.amount,
    }),
    [fields, overrides, resolvedIds, entry],
  )

  const errors = useMemo(() => validateSingleLineEntry(value), [value])
  const preview = useMemo(() => buildJournalPreview(value), [value])

  const mutation = useMutation({
    mutationFn: (input: SingleLineJournalInput) => editJournalEntry(entry.id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['journal'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  const update = (key: keyof typeof fields, nextValue: string) =>
    setFields((current) => ({ ...current, [key]: nextValue }))

  const options = optionsQuery.data
  const projects = options?.projects ?? []
  const currentType = value.type
  const categoryAccounts = (options?.accounts ?? []).filter((a) =>
    currentType === 'expense' ? a.accountType === 'expense' : a.accountType === 'revenue',
  )
  const paymentAccounts = (options?.accounts ?? []).filter((a) => a.accountType === 'asset')

  const selectProject = (id: string) => {
    const project = projects.find((p) => p.id === id)
    setOverrides((c) => ({ ...c, projectId: id, projectName: project?.name ?? '' }))
  }

  const selectCategoryAccount = (id: string) => {
    const account = categoryAccounts.find((a) => a.id === id)
    setOverrides((c) => ({ ...c, categoryAccountId: id, category: account?.name ?? '' }))
  }

  const selectPaymentAccount = (id: string) => {
    const account = paymentAccounts.find((a) => a.id === id)
    setOverrides((c) => ({ ...c, paymentAccountId: id, paymentAccount: account?.name ?? '' }))
  }

  const selectType = (type: SingleLineJournalInput['type']) => {
    setOverrides((c) => ({ ...c, type, categoryAccountId: '', category: '' }))
  }

  const submit = async (): Promise<boolean> => {
    if (submissionInProgressRef.current || mutation.isPending) return false
    setSubmitted(true)
    if (errors.length > 0) return false

    submissionInProgressRef.current = true
    try {
      await mutation.mutateAsync(value)
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
    optionsError: optionsQuery.error
      ? toErrorMessage(optionsQuery.error, 'تعذر تحميل خيارات القيد.')
      : '',
    submit,
    isSaving: mutation.isPending,
    saveError: mutation.error ? toErrorMessage(mutation.error, 'تعذر حفظ التعديل.') : '',
  }
}

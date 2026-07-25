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
import type { SingleLineJournalInput } from '../types/journal-entry.types'
import type { JournalEntry } from '../types/journal.types'

function entryToInput(entry: JournalEntry): SingleLineJournalInput {
  return {
    requestId: crypto.randomUUID(),
    entryDate: entry.entryDate,
    projectId: '',
    projectName: entry.projectName,
    type: entry.type,
    categoryAccountId: '',
    category: entry.category,
    description: entry.description,
    contractor: entry.contractor ?? '',
    paymentAccountId: '',
    paymentAccount: entry.paymentMethod ?? '',
    amount: String(entry.amount),
  }
}

export function useEditJournalForm(entry: JournalEntry) {
  const queryClient = useQueryClient()
  const submissionInProgressRef = useRef(false)
  const idsResolvedRef = useRef(false)
  const [value, setValue] = useState<SingleLineJournalInput>(() => entryToInput(entry))
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

  // ربط الـ IDs بالأسماء بعد تحميل الـ options — مرة واحدة فقط بدون state إضافية
  const options = optionsQuery.data
  useEffect(() => {
    if (!options || idsResolvedRef.current) return
    idsResolvedRef.current = true
    const matchedProject = options.projects.find((p) => p.name === entry.projectName)
    const matchedCategory = options.accounts.find(
      (a) => a.name === entry.category || `${a.code} - ${a.name}` === entry.category,
    )
    const matchedPayment = options.accounts.find(
      (a) => a.name === entry.paymentMethod || `${a.code} - ${a.name}` === entry.paymentMethod,
    )
    const patch = {
      projectId: matchedProject?.id,
      categoryAccountId: matchedCategory?.id,
      paymentAccountId: matchedPayment?.id,
    }
    const hasPatch = Object.values(patch).some(Boolean)
    if (hasPatch) {
      setValue((current) => ({
        ...current,
        ...(patch.projectId ? { projectId: patch.projectId } : {}),
        ...(patch.categoryAccountId ? { categoryAccountId: patch.categoryAccountId } : {}),
        ...(patch.paymentAccountId ? { paymentAccountId: patch.paymentAccountId } : {}),
      }))
    }
  }, [options, entry])

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

  const update = <K extends keyof SingleLineJournalInput>(
    key: K,
    nextValue: SingleLineJournalInput[K],
  ) => setValue((current) => ({ ...current, [key]: nextValue }))

  const projects = options?.projects ?? []
  const categoryAccounts = (options?.accounts ?? []).filter((a) =>
    value.type === 'expense' ? a.accountType === 'expense' : a.accountType === 'revenue',
  )
  const paymentAccounts = (options?.accounts ?? []).filter((a) => a.accountType === 'asset')

  const selectProject = (id: string) => {
    const project = projects.find((p) => p.id === id)
    setValue((c) => ({ ...c, projectId: id, projectName: project?.name ?? '' }))
  }

  const selectCategoryAccount = (id: string) => {
    const account = categoryAccounts.find((a) => a.id === id)
    setValue((c) => ({ ...c, categoryAccountId: id, category: account?.name ?? '' }))
  }

  const selectPaymentAccount = (id: string) => {
    const account = paymentAccounts.find((a) => a.id === id)
    setValue((c) => ({ ...c, paymentAccountId: id, paymentAccount: account?.name ?? '' }))
  }

  const selectType = (type: SingleLineJournalInput['type']) => {
    setValue((c) => ({ ...c, type, categoryAccountId: '', category: '' }))
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

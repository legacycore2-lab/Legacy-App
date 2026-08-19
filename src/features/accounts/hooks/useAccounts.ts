import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  getAccounts,
  removeAccount,
  restoreAccount,
  toggleAccount,
  upsertAccount,
  watchAccounts,
} from '../services/accounts.service'
import type { Account, AccountInput, AccountType } from '../types/accounts.types'

const accountsQueryKey = ['accounts'] as const
const cashBanksQueryKey = ['cash-banks'] as const

export function useAccounts() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<AccountType | 'all'>('all')
  const [showDeleted, setShowDeleted] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [expandedState, setExpandedState] = useState<Set<string> | null>(null)
  const query = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts, staleTime: 30_000 })
  const allRecords = useMemo(() => query.data ?? [], [query.data])
  const liveAccounts = useMemo(() => allRecords.filter((account) => !account.deletedAt), [allRecords])

  const refreshLinkedAccountViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
      queryClient.invalidateQueries({ queryKey: cashBanksQueryKey }),
    ])
  }

  useEffect(
    () => watchAccounts(() => void queryClient.invalidateQueries({ queryKey: accountsQueryKey })),
    [queryClient],
  )

  const defaultExpandedIds = useMemo(
    () => new Set(liveAccounts.filter((account) => !account.parentId).map((account) => account.id)),
    [liveAccounts],
  )
  const expandedIds = expandedState ?? defaultExpandedIds

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const source = showDeleted ? allRecords : liveAccounts
    const byId = new Map(source.map((account) => [account.id, account]))
    const matches = source.filter(
      (account) =>
        (type === 'all' || account.accountType === type) &&
        (!term || `${account.code} ${account.nameAr} ${account.nameEn}`.toLowerCase().includes(term)),
    )

    if (!term) return matches

    const visible = new Map(matches.map((account) => [account.id, account]))
    matches.forEach((account) => {
      let parentId = account.parentId
      while (parentId) {
        const parent = byId.get(parentId)
        if (!parent || (type !== 'all' && parent.accountType !== type)) break
        visible.set(parent.id, parent)
        parentId = parent.parentId
      }
    })

    return source.filter((account) => visible.has(account.id))
  }, [allRecords, liveAccounts, search, showDeleted, type])

  const saveMutation = useMutation({
    mutationFn: (input: AccountInput) => upsertAccount(input, allRecords),
    onSuccess: async () => {
      setEditing(null)
      setIsEditorOpen(false)
      await refreshLinkedAccountViews()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleAccount(id, active, allRecords),
    onSuccess: refreshLinkedAccountViews,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeAccount(id, allRecords),
    onSuccess: refreshLinkedAccountViews,
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreAccount(id, allRecords),
    onSuccess: refreshLinkedAccountViews,
  })

  const openCreate = () => {
    setEditing(null)
    setIsEditorOpen(true)
  }

  const openEdit = (account: Account) => {
    if (account.deletedAt) return
    setEditing(account)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditing(null)
    setIsEditorOpen(false)
  }

  const toggleExpanded = (id: string) => {
    setExpandedState((current) => {
      const next = new Set(current ?? defaultExpandedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return {
    accounts: filteredAccounts,
    allAccounts: liveAccounts,
    deletedCount: allRecords.length - liveAccounts.length,
    search,
    onSearchChange: setSearch,
    type,
    onTypeChange: setType,
    showDeleted,
    onShowDeletedChange: setShowDeleted,
    editing,
    isEditorOpen,
    onCreate: openCreate,
    onEdit: openEdit,
    onCancelEdit: closeEditor,
    expandedIds,
    onToggleExpanded: toggleExpanded,
    onSave: (input: AccountInput) => saveMutation.mutateAsync(input),
    onToggle: (id: string, active: boolean) => toggleMutation.mutate({ id, active }),
    onDelete: (id: string) => deleteMutation.mutateAsync(id),
    onRestore: (id: string) => restoreMutation.mutateAsync(id),
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending || restoreMutation.isPending,
    error: query.error
      ? toErrorMessage(query.error, 'تعذر تحميل دليل الحسابات.')
      : saveMutation.error
        ? toErrorMessage(saveMutation.error, 'تعذر حفظ الحساب.')
        : toggleMutation.error
          ? toErrorMessage(toggleMutation.error, 'تعذر تغيير حالة الحساب.')
          : deleteMutation.error
            ? toErrorMessage(deleteMutation.error, 'تعذر حذف الحساب.')
            : restoreMutation.error
              ? toErrorMessage(restoreMutation.error, 'تعذر استعادة الحساب.')
              : '',
  }
}

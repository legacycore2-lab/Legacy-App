import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getAccounts, toggleAccount, upsertAccount, watchAccounts } from '../services/accounts.service'
import type { Account, AccountInput, AccountType } from '../types/accounts.types'

export function useAccounts() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<AccountType | 'all'>('all')
  const [editing, setEditing] = useState<Account | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const query = useQuery({ queryKey: ['accounts'], queryFn: getAccounts, staleTime: 30_000 })
  const accounts = useMemo(() => query.data ?? [], [query.data])

  useEffect(
    () => watchAccounts(() => void queryClient.invalidateQueries({ queryKey: ['accounts'] })),
    [queryClient],
  )

  useEffect(() => {
    if (accounts.length === 0) return

    setExpandedIds((current) => {
      if (current.size > 0) return current
      return new Set(accounts.filter((account) => !account.parentId).map((account) => account.id))
    })
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const byId = new Map(accounts.map((account) => [account.id, account]))
    const matches = accounts.filter(
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

    return accounts.filter((account) => visible.has(account.id))
  }, [accounts, search, type])

  const saveMutation = useMutation({
    mutationFn: (input: AccountInput) => upsertAccount(input, accounts),
    onSuccess: async () => {
      setEditing(null)
      setIsEditorOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleAccount(id, active, accounts),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  const openCreate = () => {
    setEditing(null)
    setIsEditorOpen(true)
  }

  const openEdit = (account: Account) => {
    setEditing(account)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditing(null)
    setIsEditorOpen(false)
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return {
    accounts: filteredAccounts,
    allAccounts: accounts,
    search,
    onSearchChange: setSearch,
    type,
    onTypeChange: setType,
    editing,
    isEditorOpen,
    onCreate: openCreate,
    onEdit: openEdit,
    onCancelEdit: closeEditor,
    expandedIds,
    onToggleExpanded: toggleExpanded,
    onSave: (input: AccountInput) => saveMutation.mutateAsync(input),
    onToggle: (id: string, active: boolean) => toggleMutation.mutate({ id, active }),
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    error: query.error
      ? toErrorMessage(query.error, 'تعذر تحميل دليل الحسابات.')
      : saveMutation.error
        ? toErrorMessage(saveMutation.error, 'تعذر حفظ الحساب.')
        : toggleMutation.error
          ? toErrorMessage(toggleMutation.error, 'تعذر تغيير حالة الحساب.')
          : '',
  }
}

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
  const query = useQuery({ queryKey: ['accounts'], queryFn: getAccounts, staleTime: 30_000 })
  const accounts = useMemo(() => query.data ?? [], [query.data])

  useEffect(
    () => watchAccounts(() => void queryClient.invalidateQueries({ queryKey: ['accounts'] })),
    [queryClient],
  )

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return accounts.filter(
      (account) =>
        (type === 'all' || account.accountType === type) &&
        (!term || `${account.code} ${account.nameAr} ${account.nameEn}`.toLowerCase().includes(term)),
    )
  }, [accounts, search, type])

  const saveMutation = useMutation({
    mutationFn: (input: AccountInput) => upsertAccount(input, accounts),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleAccount(id, active, accounts),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  return {
    accounts: filteredAccounts,
    allAccounts: accounts,
    search,
    onSearchChange: setSearch,
    type,
    onTypeChange: setType,
    editing,
    onEdit: setEditing,
    onCancelEdit: () => setEditing(null),
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

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addUser, editUser, getUsersViewModel, setUserStatus } from '../services/users.service'
import type { CreateUserInput, ManagedUser, UpdateUserInput, UsersFilters } from '../types/users.types'

const initialFilters: UsersFilters = {
  query: '',
  role: 'all',
  status: 'all',
}

export function useUsers() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<UsersFilters>(initialFilters)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['users-management', filters],
    queryFn: () => getUsersViewModel(filters),
    staleTime: 30_000,
  })

  const selectedUser = useMemo<ManagedUser | null>(() => {
    if (!selectedUserId) return null
    return query.data?.users.find((user) => user.id === selectedUserId) ?? null
  }, [query.data?.users, selectedUserId])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users-management'] })
  const createMutation = useMutation({ mutationFn: addUser, onSuccess: refresh })
  const updateMutation = useMutation({ mutationFn: editUser, onSuccess: refresh })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: Pick<ManagedUser, 'id' | 'status'>) => setUserStatus(id, status),
    onSuccess: refresh,
  })

  return {
    filters,
    setFilters,
    users: query.data?.filteredUsers ?? [],
    summary: query.data?.summary ?? { total: 0, active: 0, admins: 0, suspended: 0 },
    selectedUser,
    selectUser: setSelectedUserId,
    closeUserDetails: () => setSelectedUserId(null),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createUser: (input: CreateUserInput) => createMutation.mutateAsync(input),
    updateUser: (input: UpdateUserInput) => updateMutation.mutateAsync(input),
    changeUserStatus: (user: ManagedUser) =>
      statusMutation.mutateAsync({
        id: user.id,
        status: user.status === 'active' ? 'suspended' : 'active',
      }),
    isSaving: createMutation.isPending || updateMutation.isPending || statusMutation.isPending,
    mutationError: createMutation.error ?? updateMutation.error ?? statusMutation.error,
  }
}

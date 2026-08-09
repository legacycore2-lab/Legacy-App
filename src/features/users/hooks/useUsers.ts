import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addUser,
  changeTemporaryPassword,
  editUser,
  getEffectivePermissions,
  getUserAdministrationDetails,
  getUsersViewModel,
  setUserStatus,
  updateUserProjects,
} from '../services/users.service'
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

  const detailsQuery = useQuery({
    queryKey: ['users-management', 'details', selectedUserId],
    queryFn: () => getUserAdministrationDetails(selectedUserId!),
    enabled: Boolean(selectedUserId),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users-management'] })
  const createMutation = useMutation({ mutationFn: addUser, onSuccess: refresh })
  const updateMutation = useMutation({ mutationFn: editUser, onSuccess: refresh })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: Pick<ManagedUser, 'id' | 'status'>) => setUserStatus(id, status),
    onSuccess: refresh,
  })
  const projectsMutation = useMutation({
    mutationFn: ({ id, projectIds }: { id: string; projectIds: string[] }) =>
      updateUserProjects(id, projectIds),
    onSuccess: refresh,
  })
  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => changeTemporaryPassword(id, password),
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
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      statusMutation.isPending ||
      projectsMutation.isPending ||
      passwordMutation.isPending,
    mutationError:
      createMutation.error ??
      updateMutation.error ??
      statusMutation.error ??
      projectsMutation.error ??
      passwordMutation.error,
    administrationDetails: detailsQuery.data,
    effectivePermissions: selectedUser ? getEffectivePermissions(selectedUser.role) : [],
    saveProjects: (id: string, projectIds: string[]) => projectsMutation.mutateAsync({ id, projectIds }),
    changePassword: (id: string, password: string) => passwordMutation.mutateAsync({ id, password }),
    isDetailsLoading: detailsQuery.isLoading,
  }
}

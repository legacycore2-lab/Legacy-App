import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsersViewModel } from '../services/users.service'
import type { ManagedUser, UsersFilters } from '../types/users.types'

const initialFilters: UsersFilters = {
  query: '',
  role: 'all',
  status: 'all',
}

export function useUsers() {
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
  }
}

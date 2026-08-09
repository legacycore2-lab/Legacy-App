import { findUsers } from '../repositories/users.repository'
import type {
  ManagedUser,
  UsersFilters,
  UsersSummary,
  UsersViewModel,
} from '../types/users.types'

// prettier-ignore
function matchesQuery(user: ManagedUser, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase('ar')
  if (!normalized) return true

  return [user.displayName, user.email, user.role]
    .join(' ')
    .toLocaleLowerCase('ar')
    .includes(normalized)
}

// prettier-ignore
function isAdmin(user: ManagedUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin'
}

// prettier-ignore
function buildSummary(users: ManagedUser[]): UsersSummary {
  const active = users.filter((user) => user.status === 'active').length
  const admins = users.filter(isAdmin).length
  const suspended = users.filter((user) => user.status === 'suspended').length

  return {
    total: users.length,
    active,
    admins,
    suspended,
  }
}

// prettier-ignore
export async function getUsersViewModel(
  filters: UsersFilters,
): Promise<UsersViewModel> {
  const users = await findUsers()
  const filteredUsers = users.filter((user) => {
    if (!matchesQuery(user, filters.query)) return false
    if (filters.role !== 'all' && user.role !== filters.role) return false
    if (filters.status !== 'all' && user.status !== filters.status) return false
    return true
  })

  return {
    users,
    filteredUsers,
    summary: buildSummary(users),
  }
}

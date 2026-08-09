import type { AppRole } from '../../auth/types/auth.types'

export type UserStatus = 'active' | 'suspended'

export type ManagedUser = {
  id: string
  displayName: string
  email: string
  role: AppRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
  projectCount: number
  phone?: string
}

export type UsersFilters = {
  query: string
  role: AppRole | 'all'
  status: UserStatus | 'all'
}

export type UsersSummary = {
  total: number
  active: number
  admins: number
  suspended: number
}

export type UsersViewModel = {
  users: ManagedUser[]
  filteredUsers: ManagedUser[]
  summary: UsersSummary
}

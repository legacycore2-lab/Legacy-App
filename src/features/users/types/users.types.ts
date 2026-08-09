export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'viewer'
export type UserStatus = 'active' | 'suspended'

export type ManagedUser = {
  id: string
  displayName: string
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
  projectCount: number
  phone?: string
}

export type UsersFilters = {
  query: string
  role: UserRole | 'all'
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

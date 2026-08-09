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

export type CreateUserInput = {
  displayName: string
  email: string
  password: string
  phone?: string
  role: UserRole
}

export type UpdateUserInput = {
  id: string
  displayName: string
  phone?: string
  role: UserRole
}

export type UserProjectAccess = { id: string; name: string; assigned: boolean }
export type UserActivity = {
  id: string
  action: 'user_created' | 'user_updated' | 'status_changed' | 'password_reset' | 'projects_updated'
  details: Record<string, unknown>
  created_at: string
}
export type UserAdministrationDetails = {
  projects: UserProjectAccess[]
  activity: UserActivity[]
}
export type EffectivePermission = { label: string; allowed: boolean }

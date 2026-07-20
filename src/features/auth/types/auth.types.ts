export type AppRole = 'admin' | 'accountant' | 'viewer'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: AppRole
  roleLabel: string
}

export type LoginCredentials = {
  email: string
  password: string
}

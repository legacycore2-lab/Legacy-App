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
  remember: boolean
}

export type AuthIdentity = {
  id: string
  email: string
  fullName: string | null
  role: unknown
}

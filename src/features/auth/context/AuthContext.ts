import { createContext } from 'react'
import type { AuthUser, LoginCredentials } from '../types/auth.types'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  signIn: (credentials: LoginCredentials) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

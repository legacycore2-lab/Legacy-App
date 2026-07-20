import type { ReactNode } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useAuthSession } from '../hooks/useAuthSession'

type AuthProviderProps = { children: ReactNode }

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthContext.Provider value={useAuthSession()}>{children}</AuthContext.Provider>
}

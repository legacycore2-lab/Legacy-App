import type { ReactNode } from 'react'
import { CurrentUserContext } from '../../../shared/context/CurrentUserContext'
import { AuthContext } from '../context/AuthContext'
import { useAuthSession } from '../hooks/useAuthSession'

type AuthProviderProps = { children: ReactNode }

export function AuthProvider({ children }: AuthProviderProps) {
  const session = useAuthSession()

  return (
    <AuthContext.Provider value={session}>
      <CurrentUserContext.Provider value={session.user}>{children}</CurrentUserContext.Provider>
    </AuthContext.Provider>
  )
}

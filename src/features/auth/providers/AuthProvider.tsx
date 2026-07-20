import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../services/auth.service'
import type { AuthUser, LoginCredentials } from '../types/auth.types'
import { AuthContext } from '../context/AuthContext'

type AuthProviderProps = { children: ReactNode }

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    void authService
      .getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    const unsubscribe = authService.subscribe((currentUser) => {
      if (active) {
        setUser(currentUser)
        setIsLoading(false)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setUser(await authService.signIn(credentials))
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, isLoading, signIn, signOut }), [isLoading, signIn, signOut, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

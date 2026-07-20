import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthContextValue } from '../context/AuthContext'
import { authService } from '../services/auth.service'
import type { AuthUser, LoginCredentials } from '../types/auth.types'

export function useAuthSession(): AuthContextValue {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    let sessionVersion = 0

    const unsubscribe = authService.subscribe((currentUser) => {
      if (active) {
        sessionVersion += 1
        setUser(currentUser)
        setIsLoading(false)
      }
    })

    const requestVersion = sessionVersion

    void authService
      .getCurrentUser()
      .then((currentUser) => {
        if (active && sessionVersion === requestVersion) setUser(currentUser)
      })
      .catch(() => {
        if (active && sessionVersion === requestVersion) setUser(null)
      })
      .finally(() => {
        if (active && sessionVersion === requestVersion) setIsLoading(false)
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

  return useMemo(() => ({ user, isLoading, signIn, signOut }), [isLoading, signIn, signOut, user])
}

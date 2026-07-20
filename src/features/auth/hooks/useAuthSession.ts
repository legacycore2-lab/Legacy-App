import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthContextValue } from '../context/AuthContext'
import { authService } from '../services/auth.service'
import type { AuthUser, LoginCredentials } from '../types/auth.types'

export function useAuthSession(): AuthContextValue {
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

  return useMemo(() => ({ user, isLoading, signIn, signOut }), [isLoading, signIn, signOut, user])
}

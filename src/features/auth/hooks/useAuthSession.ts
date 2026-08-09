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

  useEffect(() => {
    if (!user) return

    let timer: number | undefined
    let active = true

    const reset = () => {
      if (timer) window.clearTimeout(timer)

      void authService.getSessionTimeoutMinutes().then((minutes) => {
        if (!active) return
        timer = window.setTimeout(() => void signOut(), minutes * 60_000)
      })
    }

    const events = ['click', 'keydown', 'pointermove'] as const
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }))
    reset()

    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [signOut, user])

  return useMemo(() => ({ user, isLoading, signIn, signOut }), [isLoading, signIn, signOut, user])
}

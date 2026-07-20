import { useCallback } from 'react'
import { canAccessRoute } from '../services/permission.service'
import { useAuth } from './useAuth'

export function usePermissions() {
  const { user } = useAuth()

  return useCallback((path: string) => Boolean(user && canAccessRoute(user.role, path)), [user])
}

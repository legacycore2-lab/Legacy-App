import { useContext } from 'react'
import { AuthContext } from '../../features/auth/context/AuthContext'

/**
 * Lightweight shared hook — returns the current user from AuthContext.
 * Features can use this without creating cross-feature imports.
 */
export function useCurrentUser() {
  return useContext(AuthContext)?.user ?? null
}

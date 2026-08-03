import { useContext } from 'react'
import { CurrentUserContext } from '../context/CurrentUserContext'

/**
 * Lightweight shared hook — returns the user projection exposed to shared consumers.
 * Features can use this without creating cross-feature imports.
 */
export function useCurrentUser() {
  return useContext(CurrentUserContext)
}

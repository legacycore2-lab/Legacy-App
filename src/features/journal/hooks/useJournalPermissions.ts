import { useContext } from 'react'
import { AuthContext } from '../../auth/context/AuthContext'

/**
 * Journal-specific permission checks.
 * Reads AuthContext directly to avoid cross-feature hook import.
 */
export function useJournalPermissions() {
  const context = useContext(AuthContext)
  const role = context?.user?.role ?? 'viewer'
  return {
    canForceDelete: role === 'admin' || role === 'super_admin',
  }
}

import { useQuery } from '@tanstack/react-query'
import { getJournalUserRole } from '../services/journal-entry.service'

/**
 * Journal-specific permission checks.
 * Fetches user role via Supabase session — no cross-feature imports.
 */
export function useJournalPermissions() {
  const { data: role } = useQuery({
    queryKey: ['journal', 'user-role'],
    queryFn: getJournalUserRole,
    staleTime: Infinity,
  })

  return {
    canForceDelete: role === 'admin' || role === 'super_admin',
  }
}

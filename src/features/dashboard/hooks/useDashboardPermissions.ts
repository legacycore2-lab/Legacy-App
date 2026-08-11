import { useCurrentUser } from '../../../shared/hooks/useCurrentUser'

export function useDashboardPermissions() {
  const currentUser = useCurrentUser()
  const role = currentUser?.role ?? 'viewer'
  const canWrite = role === 'super_admin' || role === 'admin' || role === 'accountant'

  return {
    canCreateProject: canWrite,
    canCreateJournalEntry: canWrite,
    canCreateAdvance: canWrite,
    canTransferFunds: canWrite,
  }
}

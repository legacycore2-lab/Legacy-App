import { useCurrentUser } from '../../../shared/hooks/useCurrentUser'

export function useJournalPermissions() {
  const user = useCurrentUser()
  const role = user?.role
  const isFinance = role === 'super_admin' || role === 'admin' || role === 'accountant'

  return {
    canReverse: isFinance,
    canManageAttachments: isFinance,
    canForceDelete: role === 'admin' || role === 'super_admin',
  }
}

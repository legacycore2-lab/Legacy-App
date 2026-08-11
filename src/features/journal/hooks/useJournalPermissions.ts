import { useCurrentUser } from '../../../shared/hooks/useCurrentUser'

export function useJournalPermissions() {
  const user = useCurrentUser()
  const role = user?.role

  return {
    canReverse: role === 'super_admin' || role === 'admin' || role === 'accountant',
    canForceDelete: role === 'admin' || role === 'super_admin',
  }
}

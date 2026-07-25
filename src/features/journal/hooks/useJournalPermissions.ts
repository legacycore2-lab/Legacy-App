import { useCurrentUser } from '../../../shared/hooks/useCurrentUser'

export function useJournalPermissions() {
  const user = useCurrentUser()

  return {
    canForceDelete: user?.role === 'admin' || user?.role === 'super_admin',
  }
}

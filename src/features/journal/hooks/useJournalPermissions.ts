import { useAuth } from '../../auth/hooks/useAuth'

export function useJournalPermissions() {
  const { user } = useAuth()

  return {
    canForceDelete: user?.role === 'admin' || user?.role === 'super_admin',
  }
}

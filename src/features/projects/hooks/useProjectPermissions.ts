import { useCurrentUser } from '../../../shared/hooks/useCurrentUser'

export function useProjectPermissions() {
  const role = useCurrentUser()?.role
  const canManage = role === 'super_admin' || role === 'admin' || role === 'accountant'

  return {
    canCreate: canManage,
    canEdit: canManage,
    canArchive: canManage,
    canDelete: role === 'super_admin' || role === 'admin',
  }
}

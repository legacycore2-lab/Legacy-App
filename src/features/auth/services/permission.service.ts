import type { AppRole } from '../types/auth.types'

const routeRoles: Record<string, readonly AppRole[]> = {
  '/': ['super_admin', 'admin', 'accountant', 'viewer'],
  '/projects': ['super_admin', 'admin', 'accountant', 'viewer'],
  '/journal': ['super_admin', 'admin', 'accountant'],
  '/accounts': ['super_admin', 'admin', 'accountant'],
  '/banks': ['super_admin', 'admin', 'accountant'],
  '/advances': ['super_admin', 'admin', 'accountant'],
  '/reports': ['super_admin', 'admin', 'accountant', 'viewer'],
  '/users': ['super_admin', 'admin'],
  '/settings': ['super_admin', 'admin'],
}

export function canAccessRoute(role: AppRole, path: string): boolean {
  return (routeRoles[path] ?? []).includes(role)
}

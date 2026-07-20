import type { AppRole } from '../types/auth.types'

const routeRoles: Record<string, readonly AppRole[]> = {
  '/': ['admin', 'accountant', 'viewer'],
  '/projects': ['admin', 'accountant', 'viewer'],
  '/journal': ['admin', 'accountant'],
  '/banks': ['admin', 'accountant'],
  '/advances': ['admin', 'accountant'],
  '/reports': ['admin', 'accountant', 'viewer'],
  '/users': ['admin'],
  '/settings': ['admin'],
}

export function canAccessRoute(role: AppRole, path: string): boolean {
  return (routeRoles[path] ?? []).includes(role)
}

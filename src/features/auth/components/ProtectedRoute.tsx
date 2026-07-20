import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { AuthLoadingScreen } from './AuthLoadingScreen'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoadingScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}

type RequireRouteAccessProps = {
  path: string
  children: ReactNode
}

export function RequireRouteAccess({ path, children }: RequireRouteAccessProps) {
  const canAccess = usePermissions()
  return canAccess(path) ? children : <Navigate to="/" replace />
}

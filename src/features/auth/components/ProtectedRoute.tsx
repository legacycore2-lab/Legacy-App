import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { AppRole } from '../types/auth.types'
import { useAuth } from '../hooks/useAuth'
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

type RequireRoleProps = {
  allowed: AppRole[]
  children: ReactNode
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { user } = useAuth()
  return user && allowed.includes(user.role) ? children : <Navigate to="/" replace />
}

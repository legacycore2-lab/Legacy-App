import { Outlet, useLocation } from 'react-router-dom'
import { PageErrorBoundary } from '../components/PageErrorBoundary'
import { AppShell } from './AppShell'

export function AppLayoutRoute() {
  const { pathname } = useLocation()

  return (
    <AppShell>
      <PageErrorBoundary key={pathname}>
        <Outlet />
      </PageErrorBoundary>
    </AppShell>
  )
}

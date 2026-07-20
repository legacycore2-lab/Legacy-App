import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'

export function AppLayoutRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

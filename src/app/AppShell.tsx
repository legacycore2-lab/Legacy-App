import { useState, type ReactNode } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../features/auth/hooks/useAuth'
import { usePermissions } from '../features/auth/hooks/usePermissions'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const canAccess = usePermissions()

  return (
    <div className="app-layout" dir="rtl">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user?.displayName ?? 'مستخدم النظام'}
        roleLabel={user?.roleLabel ?? 'الحساب الحالي'}
        canAccess={canAccess}
        onLogout={() => void signOut()}
      />

      <div className="app-main">
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenMenu={() => setSidebarOpen(true)}
          userName={user?.displayName ?? 'مستخدم النظام'}
          roleLabel={user?.roleLabel ?? 'الحساب الحالي'}
          canManageSystem={canAccess('/settings')}
          onLogout={() => void signOut()}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}

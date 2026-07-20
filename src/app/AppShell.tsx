import { useState, type ReactNode } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../features/auth/hooks/useAuth'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()

  return (
    <div className="app-layout" dir="rtl">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user?.displayName ?? 'مستخدم النظام'}
        roleLabel={user?.roleLabel ?? 'الحساب الحالي'}
        canManageSystem={user?.role === 'admin'}
        onLogout={() => void signOut()}
      />

      <div className="app-main">
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenMenu={() => setSidebarOpen(true)}
          userName={user?.displayName ?? 'مستخدم النظام'}
          roleLabel={user?.roleLabel ?? 'الحساب الحالي'}
          canManageSystem={user?.role === 'admin'}
          onLogout={() => void signOut()}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}

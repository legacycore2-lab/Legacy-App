import { useState, type ReactNode } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { useTheme } from '../hooks/useTheme'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="app-layout" dir="rtl">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <Topbar theme={theme} onToggleTheme={toggleTheme} onOpenMenu={() => setSidebarOpen(true)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}

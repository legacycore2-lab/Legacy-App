import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import type { ThemeMode } from '../../hooks/useTheme'

type TopbarProps = {
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenMenu: () => void
}

export function Topbar({ theme, onToggleTheme, onOpenMenu }: TopbarProps) {
  return (
    <header className="main-topbar">
      <button className="icon-button menu-button" onClick={onOpenMenu} aria-label="فتح القائمة">
        <Menu size={21} />
      </button>

      <label className="global-search">
        <Search size={18} />
        <input aria-label="البحث" placeholder="ابحث في المشاريع، المعاملات، القيود..." />
        <kbd>⌘ K</kbd>
      </label>

      <div className="topbar-actions">
        <button className="icon-button notification-button" aria-label="الإشعارات">
          <Bell size={20} />
          <span>3</span>
        </button>

        <button className="theme-toggle" onClick={onToggleTheme} aria-label="تغيير المظهر">
          <Sun size={17} />
          <span className={`toggle-track ${theme === 'light' ? 'is-light' : ''}`}>
            <span />
          </span>
          <Moon size={17} />
        </button>

        <button className="topbar-profile" type="button">
          <span className="avatar">م</span>
          <span>
            <strong>Mahmoud Mosbah</strong>
            <small>Administrator</small>
          </span>
        </button>
      </div>
    </header>
  )
}

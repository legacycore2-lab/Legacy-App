import { FilePlus2, FolderPlus, Menu, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getNavigationItem } from '../../app/navigation'
import type { ThemeMode } from '../../hooks/useTheme'
import { CurrentDate } from './CurrentDate'
import { NotificationsMenu } from './NotificationsMenu'
import { ProfileMenu } from './ProfileMenu'
import './topbar.css'

type Props = {
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenMenu: () => void
  userName: string
  roleLabel: string
  canManageSystem: boolean
  onLogout: () => void
}

export function Topbar({
  theme,
  onToggleTheme,
  onOpenMenu,
  userName,
  roleLabel,
  canManageSystem,
  onLogout,
}: Props) {
  const navigate = useNavigate()
  const meta = getNavigationItem(useLocation().pathname)
  const menusRef = useRef<HTMLDivElement>(null)
  const [openMenu, setOpenMenu] = useState<'notifications' | 'profile' | null>(null)

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!menusRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [])

  return (
    <header className="main-topbar">
      <div className="topbar-leading">
        <button className="icon-button menu-button" onClick={onOpenMenu} aria-label="فتح القائمة">
          <Menu size={21} />
        </button>
        <div className="topbar-title">
          <strong>{meta.label}</strong>
          <span>{meta.eyebrow}</span>
        </div>
      </div>
      <label className="global-search">
        <Search size={18} />
        <input aria-label="البحث" placeholder="ابحث في المشاريع، المقاولين، القيود..." />
        <kbd>Ctrl + K</kbd>
      </label>
      <div className="topbar-quick-actions">
        <button className="topbar-quick-action primary" type="button" onClick={() => navigate('/projects')}>
          <FolderPlus size={18} />
          <span>إضافة مشروع</span>
        </button>
        <button className="topbar-quick-action secondary" type="button" onClick={() => navigate('/journal')}>
          <FilePlus2 size={18} />
          <span>إضافة قيد</span>
        </button>
      </div>
      <div className="topbar-actions" ref={menusRef}>
        <CurrentDate />
        <NotificationsMenu
          open={openMenu === 'notifications'}
          onToggle={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
        />
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="تغيير المظهر">
          <Sun size={17} />
          <span className={`toggle-track ${theme === 'light' ? 'is-light' : ''}`}>
            <span />
          </span>
          <Moon size={17} />
        </button>
        <ProfileMenu
          open={openMenu === 'profile'}
          onToggle={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
          userName={userName}
          roleLabel={roleLabel}
          canManageSystem={canManageSystem}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}

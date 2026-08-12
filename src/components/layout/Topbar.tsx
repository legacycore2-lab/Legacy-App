import { FilePlus2, FolderPlus, Menu, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getNavigationItem, navigationItems } from '../../app/navigation'
import type { ThemeMode } from '../../shared/hooks/useTheme'
import { CurrentDate } from './CurrentDate'
import { NotificationsMenu } from './NotificationsMenu'
import { ProfileMenu } from './ProfileMenu'
import './topbar.css'
import './topbar-command.css'

type Props = {
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenMenu: () => void
  userName: string
  roleLabel: string
  canManageSystem: boolean
  canAccess: (path: string) => boolean
  onLogout: () => void
}

export function Topbar({
  theme,
  onToggleTheme,
  onOpenMenu,
  userName,
  roleLabel,
  canManageSystem,
  canAccess,
  onLogout,
}: Props) {
  const navigate = useNavigate()
  const meta = getNavigationItem(useLocation().pathname)
  const menusRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [openMenu, setOpenMenu] = useState<'notifications' | 'profile' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const accessibleItems = navigationItems.filter((item) => canAccess(item.path))
    if (!query) return accessibleItems.slice(0, 6)

    return accessibleItems.filter((item) => {
      const haystack = [item.label, item.eyebrow, ...(item.keywords ?? [])].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [canAccess, searchQuery])

  useEffect(() => {
    function close(event: MouseEvent) {
      const target = event.target as Node
      if (!menusRef.current?.contains(target)) setOpenMenu(null)
      if (!searchRef.current?.contains(target)) setSearchOpen(false)
    }
    function keyboard(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        searchInputRef.current?.focus()
        return
      }
      if (event.key === 'Escape') {
        setOpenMenu(null)
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', keyboard)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', keyboard)
    }
  }, [])

  const openSearchResult = (path: string) => {
    navigate(path)
    setSearchQuery('')
    setSearchOpen(false)
  }

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
      <div className="global-search-wrap" ref={searchRef}>
        <label className="global-search">
          <Search size={18} />
          <input
            ref={searchInputRef}
            aria-label="البحث في أقسام النظام"
            placeholder="ابحث في أقسام النظام..."
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setSearchOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchResults[0]) {
                event.preventDefault()
                openSearchResult(searchResults[0].path)
              }
            }}
          />
          <kbd>Ctrl + K</kbd>
        </label>
        {searchOpen && (
          <div className="global-search-results" role="listbox" aria-label="نتائج البحث">
            {searchResults.length > 0 ? (
              searchResults.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => openSearchResult(item.path)}
                  >
                    <Icon size={17} />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.eyebrow}</small>
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="global-search-empty">لا توجد أقسام مطابقة.</div>
            )}
          </div>
        )}
      </div>
      <div className="topbar-quick-actions">
        <button
          className="topbar-quick-action primary"
          type="button"
          onClick={() => navigate('/projects?create=1')}
        >
          <FolderPlus size={18} />
          <span>إضافة مشروع</span>
        </button>
        <button
          className="topbar-quick-action secondary"
          type="button"
          onClick={() => navigate('/journal?create=1')}
        >
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

import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../app/navigation'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <button
        className={`sidebar-backdrop ${open ? 'is-visible' : ''}`}
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark">LC</div>
          <div>
            <strong>LEGACY</strong>
            <span>CORE</span>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="إغلاق القائمة">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="التنقل الرئيسي">
          {navigationItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={onClose}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="profile-card" type="button">
            <span className="avatar">م</span>
            <span className="profile-copy">
              <strong>Mahmoud Mosbah</strong>
              <small>Administrator</small>
            </span>
            <ChevronDown size={16} />
          </button>

          <button className="logout-button" type="button">
            <LogOut size={17} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <button className="mobile-menu-trigger" onClick={() => (open ? onClose() : undefined)} aria-hidden="true">
        <Menu size={20} />
      </button>
    </>
  )
}

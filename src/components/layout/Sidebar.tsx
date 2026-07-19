import { ChevronLeft, LogOut, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  navigationItems,
  navigationSections,
  type NavigationItem,
} from '../../app/navigation'
import './sidebar.css'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

function matchesSearch(item: NavigationItem, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ar')

  if (!normalizedQuery) return true

  const searchableText = [item.label, item.path, ...(item.keywords ?? [])]
    .join(' ')
    .toLocaleLowerCase('ar')

  return searchableText.includes(normalizedQuery)
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = useMemo(
    () => navigationItems.filter((item) => matchesSearch(item, searchQuery)),
    [searchQuery],
  )

  return (
    <>
      <button
        className={`sidebar-backdrop ${open ? 'is-visible' : ''}`}
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />

      <aside className={`sidebar lc-sidebar ${open ? 'is-open' : ''}`}>
        <div className="lc-sidebar__brand">
          <div className="lc-sidebar__mark" aria-hidden="true">
            <span className="lc-sidebar__tower tower-one" />
            <span className="lc-sidebar__tower tower-two" />
            <span className="lc-sidebar__tower tower-three" />
            <strong>LC</strong>
          </div>

          <div className="lc-sidebar__brand-copy">
            <strong>LEGACY CORE</strong>
            <span>Construction ERP</span>
          </div>

          <button className="sidebar-close" onClick={onClose} aria-label="إغلاق القائمة">
            <X size={20} />
          </button>
        </div>

        <label className="lc-sidebar__search">
          <Search size={17} strokeWidth={1.8} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="بحث سريع..."
            aria-label="بحث في أقسام النظام"
          />
          <kbd>Ctrl K</kbd>
        </label>

        <nav className="lc-sidebar__nav" aria-label="التنقل الرئيسي">
          {navigationSections.map((section) => {
            const sectionItems = filteredItems.filter((item) => item.section === section.id)

            if (sectionItems.length === 0) return null

            return (
              <div className="lc-sidebar__section" key={section.id}>
                <span className="lc-sidebar__section-label">{section.label}</span>

                <div className="lc-sidebar__section-items">
                  {sectionItems.map(({ label, path, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end={path === '/'}
                      className={({ isActive }) =>
                        `lc-sidebar__item ${isActive ? 'is-active' : ''}`
                      }
                      onClick={onClose}
                      title={label}
                    >
                      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                      <span>{label}</span>
                      <ChevronLeft
                        className="lc-sidebar__item-arrow"
                        size={15}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredItems.length === 0 && (
            <div className="lc-sidebar__empty">
              <Search size={19} aria-hidden="true" />
              <span>لا توجد نتيجة مطابقة</span>
            </div>
          )}
        </nav>

        <div className="lc-sidebar__footer">
          <button className="lc-sidebar__profile" type="button">
            <span className="avatar">م</span>
            <span className="lc-sidebar__profile-copy">
              <strong>Mahmoud Mosbah</strong>
              <small>Administrator</small>
            </span>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>

          <button className="lc-sidebar__logout" type="button">
            <LogOut size={17} aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  )
}
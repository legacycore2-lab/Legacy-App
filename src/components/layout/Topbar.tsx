import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  FilePlus2,
  FolderPlus,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ThemeMode } from '../../hooks/useTheme'
import './topbar.css'

type TopbarProps = {
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenMenu: () => void
}

type RouteMeta = {
  title: string
  eyebrow: string
}

const routeMeta: Record<string, RouteMeta> = {
  '/': { title: 'لوحة التحكم', eyebrow: 'الرئيسية' },
  '/projects': { title: 'المشاريع', eyebrow: 'إدارة المشاريع' },
  '/banks': { title: 'الخزنة والبنوك', eyebrow: 'الحسابات المالية' },
  '/advances': { title: 'العهد', eyebrow: 'إدارة العهد' },
  '/reports': { title: 'التقارير', eyebrow: 'التقارير والتحليلات' },
  '/users': { title: 'المستخدمون', eyebrow: 'الإدارة والصلاحيات' },
  '/settings': { title: 'الإعدادات', eyebrow: 'إعدادات النظام' },
}

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function useCurrentDate() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return useMemo(() => dateFormatter.format(now), [now])
}

export function Topbar({ theme, onToggleTheme, onOpenMenu }: TopbarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const popoversRef = useRef<HTMLDivElement>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const currentDate = useCurrentDate()
  const pageMeta = routeMeta[pathname] ?? routeMeta['/']

  useEffect(() => {
    function closePopovers(event: MouseEvent) {
      if (!popoversRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', closePopovers)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closePopovers)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <header className="main-topbar">
      <div className="topbar-leading">
        <button className="icon-button menu-button" onClick={onOpenMenu} aria-label="فتح القائمة">
          <Menu size={21} />
        </button>

        <div className="topbar-title">
          <strong>{pageMeta.title}</strong>
          <span>{pageMeta.eyebrow}</span>
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

        <button
          className="topbar-quick-action secondary"
          type="button"
          disabled
          title="إضافة القيد غير متاحة في هذه الشاشة"
        >
          <FilePlus2 size={18} />
          <span>إضافة قيد</span>
        </button>
      </div>

      <div className="topbar-actions" ref={popoversRef}>
        <div className="topbar-date" aria-label={currentDate}>
          <CalendarDays size={18} />
          <span>{currentDate}</span>
        </div>

        <div className="topbar-popover-wrap">
          <button
            className="icon-button notification-button"
            type="button"
            aria-label="الإشعارات"
            aria-haspopup="menu"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((value) => !value)
              setProfileOpen(false)
            }}
          >
            <Bell size={20} />
            <span>3</span>
          </button>

          {notificationsOpen && (
            <div className="topbar-popover notifications-popover" role="menu">
              <div className="popover-heading">
                <strong>الإشعارات</strong>
                <small>3 جديدة</small>
              </div>
              <button type="button" role="menuitem">
                <i className="alert-dot danger" />
                <span><strong>تنبيه ميزانية</strong><small>مصروفات أحد المشاريع اقتربت من الحد.</small></span>
              </button>
              <button type="button" role="menuitem">
                <i className="alert-dot success" />
                <span><strong>دفعة عميل</strong><small>تم تسجيل دفعة جديدة بنجاح.</small></span>
              </button>
              <button type="button" role="menuitem">
                <i className="alert-dot warning" />
                <span><strong>عهدة مستحقة</strong><small>توجد عهدة تحتاج إلى التسوية.</small></span>
              </button>
            </div>
          )}
        </div>

        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="تغيير المظهر">
          <Sun size={17} />
          <span className={`toggle-track ${theme === 'light' ? 'is-light' : ''}`}>
            <span />
          </span>
          <Moon size={17} />
        </button>

        <div className="topbar-popover-wrap profile-wrap">
          <button
            className="topbar-profile"
            type="button"
            aria-label="قائمة الحساب"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((value) => !value)
              setNotificationsOpen(false)
            }}
          >
            <span className="avatar">م</span>
            <span className="topbar-profile-copy">
              <strong>Mahmoud Mosbah</strong>
              <small><i /> Administrator</small>
            </span>
            <ChevronDown size={15} />
          </button>

          {profileOpen && (
            <div className="topbar-popover profile-popover" role="menu">
              <button type="button" role="menuitem"><UserRound size={17} /><span>الملف الشخصي</span></button>
              <button type="button" role="menuitem" onClick={() => navigate('/settings')}><Settings size={17} /><span>الإعدادات</span></button>
              <div className="popover-divider" />
              <button className="danger-action" type="button" role="menuitem"><LogOut size={17} /><span>تسجيل الخروج</span></button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

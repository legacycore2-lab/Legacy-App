import { useState } from 'react'
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
import { useNavigate } from 'react-router-dom'
import type { ThemeMode } from '../../hooks/useTheme'
import './topbar.css'

type TopbarProps = {
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenMenu: () => void
}

const currentDate = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

export function Topbar({ theme, onToggleTheme, onOpenMenu }: TopbarProps) {
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="main-topbar">
      <div className="topbar-leading">
        <button className="icon-button menu-button" onClick={onOpenMenu} aria-label="فتح القائمة">
          <Menu size={21} />
        </button>

        <div className="topbar-title">
          <strong>لوحة التحكم</strong>
          <span>الرئيسية</span>
        </div>
      </div>

      <label className="global-search">
        <Search size={18} />
        <input aria-label="البحث" placeholder="ابحث في المشاريع، المقاولين، القيود..." />
        <kbd>Ctrl + K</kbd>
      </label>

      <div className="topbar-quick-actions">
        <button className="quick-action primary" type="button" onClick={() => navigate('/projects')}>
          <FolderPlus size={18} />
          <span>إضافة مشروع</span>
        </button>

        <button
          className="quick-action secondary"
          type="button"
          disabled
          title="سيتم تفعيله بعد إنشاء شاشة القيود"
        >
          <FilePlus2 size={18} />
          <span>إضافة قيد</span>
        </button>
      </div>

      <div className="topbar-actions">
        <div className="topbar-date" aria-label={currentDate}>
          <CalendarDays size={18} />
          <span>{currentDate}</span>
        </div>

        <div className="topbar-popover-wrap">
          <button
            className="icon-button notification-button"
            type="button"
            aria-label="الإشعارات"
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
            <div className="topbar-popover notifications-popover">
              <div className="popover-heading">
                <strong>الإشعارات</strong>
                <small>3 جديدة</small>
              </div>
              <button type="button">
                <i className="alert-dot danger" />
                <span><strong>تنبيه ميزانية</strong><small>مصروفات أحد المشاريع اقتربت من الحد.</small></span>
              </button>
              <button type="button">
                <i className="alert-dot success" />
                <span><strong>دفعة عميل</strong><small>تم تسجيل دفعة جديدة بنجاح.</small></span>
              </button>
              <button type="button">
                <i className="alert-dot warning" />
                <span><strong>عهدة مستحقة</strong><small>توجد عهدة تحتاج إلى التسوية.</small></span>
              </button>
            </div>
          )}
        </div>

        <button className="theme-toggle" onClick={onToggleTheme} aria-label="تغيير المظهر">
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
            <div className="topbar-popover profile-popover">
              <button type="button"><UserRound size={17} /><span>الملف الشخصي</span></button>
              <button type="button" onClick={() => navigate('/settings')}><Settings size={17} /><span>الإعدادات</span></button>
              <div className="popover-divider" />
              <button className="danger-action" type="button"><LogOut size={17} /><span>تسجيل الخروج</span></button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

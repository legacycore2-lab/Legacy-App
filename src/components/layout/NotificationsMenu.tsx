import { Bell } from 'lucide-react'

type Props = { open: boolean; onToggle: () => void }

export function NotificationsMenu({ open, onToggle }: Props) {
  return (
    <div className="topbar-popover-wrap">
      <button
        className="icon-button notification-button"
        type="button"
        aria-label="الإشعارات"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Bell size={20} />
        <span>0</span>
      </button>
      {open && (
        <div className="topbar-popover notifications-popover" role="menu">
          <div className="popover-heading">
            <strong>الإشعارات</strong>
            <small>لا توجد إشعارات جديدة</small>
          </div>
        </div>
      )}
    </div>
  )
}

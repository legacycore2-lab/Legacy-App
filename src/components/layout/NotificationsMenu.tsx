import { Bell } from 'lucide-react'
import { useSystemNotifications } from '../../shared/hooks/useSystemNotifications'

type Props = { open: boolean; onToggle: () => void }

export function NotificationsMenu({ open, onToggle }: Props) {
  const notifications = useSystemNotifications()
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
        <span>{notifications.length}</span>
      </button>
      {open && (
        <div className="topbar-popover notifications-popover" role="menu">
          <div className="popover-heading">
            <strong>الإشعارات</strong>
            <small>
              {notifications.length === 0
                ? 'لا توجد إشعارات جديدة'
                : `${notifications.length} إشعار يحتاج المتابعة`}
            </small>
          </div>
          {notifications.map((item) => (
            <div className="notification-item" key={item.id}>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

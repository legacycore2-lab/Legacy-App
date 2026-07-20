import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Props = { open: boolean; onToggle: () => void }

export function ProfileMenu({ open, onToggle }: Props) {
  const navigate = useNavigate()
  return (
    <div className="topbar-popover-wrap profile-wrap">
      <button
        className="topbar-profile"
        type="button"
        aria-label="قائمة الحساب"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="avatar">م</span>
        <span className="topbar-profile-copy">
          <strong>مستخدم النظام</strong>
          <small>
            <i /> الحساب الحالي
          </small>
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="topbar-popover profile-popover" role="menu">
          <button type="button" role="menuitem">
            <UserRound size={17} />
            <span>الملف الشخصي</span>
          </button>
          <button type="button" role="menuitem" onClick={() => navigate('/settings')}>
            <Settings size={17} />
            <span>الإعدادات</span>
          </button>
          <div className="popover-divider" />
          <button className="danger-action" type="button" role="menuitem">
            <LogOut size={17} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  )
}

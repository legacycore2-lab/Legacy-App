import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Props = {
  open: boolean
  onToggle: () => void
  userName: string
  roleLabel: string
  canManageSystem: boolean
  onLogout: () => void
}

export function ProfileMenu({ open, onToggle, userName, roleLabel, canManageSystem, onLogout }: Props) {
  const navigate = useNavigate()
  const avatarLetter = userName.trim().charAt(0) || 'م'
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
        <span className="avatar">{avatarLetter}</span>
        <span className="topbar-profile-copy">
          <strong>{userName}</strong>
          <small>
            <i /> {roleLabel}
          </small>
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="topbar-popover profile-popover" role="menu">
          {canManageSystem && (
            <button type="button" role="menuitem" onClick={() => navigate('/settings')}>
              <Settings size={17} />
              <span>الإعدادات</span>
            </button>
          )}
          <div className="popover-divider" />
          <button className="danger-action" type="button" role="menuitem" onClick={onLogout}>
            <LogOut size={17} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  )
}

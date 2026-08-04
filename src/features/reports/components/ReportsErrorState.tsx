import { AlertCircle, ShieldOff } from 'lucide-react'

type Props = {
  error: string
  raw?: unknown
  isPermission?: boolean
}

export function ReportsErrorState({ error, isPermission }: Props) {
  if (isPermission) {
    return (
      <div className="reports-state-block is-permission">
        <ShieldOff size={28} />
        <p>ليس لديك صلاحية لعرض هذه التقارير.</p>
      </div>
    )
  }

  return (
    <div className="reports-state-block is-error">
      <AlertCircle size={28} />
      <p>{error}</p>
    </div>
  )
}

import { isPermissionError } from '../../../shared/errors/app-error'
import { AlertCircle, ShieldOff } from 'lucide-react'

type Props = {
  error: string
  raw?: unknown
}

export function ReportsErrorState({ error, raw }: Props) {
  const isPerm = isPermissionError(raw)

  return (
    <div className={`reports-state-block is-${isPerm ? 'permission' : 'error'}`}>
      {isPerm ? <ShieldOff size={28} /> : <AlertCircle size={28} />}
      <p>{isPerm ? 'ليس لديك صلاحية لعرض هذه التقارير.' : error}</p>
    </div>
  )
}

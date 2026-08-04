import { FileBarChart } from 'lucide-react'

type Props = {
  message?: string
}

export function ReportsEmptyState({ message = 'لا توجد بيانات لعرضها.' }: Props) {
  return (
    <div className="reports-state-block is-empty">
      <FileBarChart size={32} />
      <p>{message}</p>
    </div>
  )
}

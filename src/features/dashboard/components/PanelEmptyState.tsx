import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  title: string
  description: string
}

export function PanelEmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="panel-empty-state" role="status">
      <span className="panel-empty-state__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  )
}

import { Archive, BriefcaseBusiness, CircleCheckBig, CirclePause, TrendingUp } from 'lucide-react'
import type { ProjectsSummary } from '../types/project.types'

type ProjectsStatsProps = {
  summary: ProjectsSummary
}

const number = new Intl.NumberFormat('ar-EG')

export function ProjectsStats({ summary }: ProjectsStatsProps) {
  const stats = [
    { label: 'إجمالي المشاريع', value: summary.total, icon: BriefcaseBusiness, tone: 'green' },
    {
      label: 'المشاريع الجارية',
      value: summary.active,
      icon: TrendingUp,
      tone: 'blue',
    },
    {
      label: 'المشاريع المكتملة',
      value: summary.completed,
      icon: CircleCheckBig,
      tone: 'gold',
    },
    {
      label: 'المشاريع المتوقفة',
      value: summary.paused,
      icon: CirclePause,
      tone: 'red',
    },
    {
      label: 'قيمة العقود',
      value: number.format(summary.totalContracts),
      icon: Archive,
      tone: 'purple',
      suffix: 'ج.م',
    },
    {
      label: 'صافي السيولة',
      value: number.format(summary.totalLiquidity),
      icon: TrendingUp,
      tone: 'teal',
      suffix: 'ج.م',
    },
  ]

  return (
    <div className="projects-stats">
      {stats.map(({ label, value, icon: Icon, tone, suffix }) => (
        <article className={`projects-stat projects-stat--${tone}`} key={label}>
          <span className="projects-stat__icon">
            <Icon size={20} />
          </span>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
            {suffix && <span>{suffix}</span>}
          </div>
        </article>
      ))}
    </div>
  )
}

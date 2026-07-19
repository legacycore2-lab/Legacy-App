import { Archive, BriefcaseBusiness, CircleCheckBig, CirclePause, TrendingUp } from 'lucide-react'
import type { Project } from '../types/project.types'

type ProjectsStatsProps = {
  projects: Project[]
}

const number = new Intl.NumberFormat('ar-EG')

export function ProjectsStats({ projects }: ProjectsStatsProps) {
  const totalContracts = projects.reduce((total, project) => total + project.contractValue, 0)
  const totalLiquidity = projects.reduce((total, project) => total + (project.received - project.spent), 0)

  const stats = [
    { label: 'إجمالي المشاريع', value: projects.length, icon: BriefcaseBusiness, tone: 'green' },
    { label: 'المشاريع الجارية', value: projects.filter((project) => project.status === 'active').length, icon: TrendingUp, tone: 'blue' },
    { label: 'المشاريع المكتملة', value: projects.filter((project) => project.status === 'completed').length, icon: CircleCheckBig, tone: 'gold' },
    { label: 'المشاريع المتوقفة', value: projects.filter((project) => project.status === 'paused').length, icon: CirclePause, tone: 'red' },
    { label: 'قيمة العقود', value: number.format(totalContracts), icon: Archive, tone: 'purple', suffix: 'ج.م' },
    { label: 'صافي السيولة', value: number.format(totalLiquidity), icon: TrendingUp, tone: 'teal', suffix: 'ج.م' },
  ]

  return (
    <div className="projects-stats">
      {stats.map(({ label, value, icon: Icon, tone, suffix }) => (
        <article className={`projects-stat projects-stat--${tone}`} key={label}>
          <span className="projects-stat__icon"><Icon size={20} /></span>
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

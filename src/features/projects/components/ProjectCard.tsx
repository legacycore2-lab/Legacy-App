import { ArrowUpLeft, CalendarDays, MapPin, MoreHorizontal, UserRound } from 'lucide-react'
import type { Project, ProjectStatus } from '../types/project.types'

const statusLabel: Record<ProjectStatus, string> = {
  active: 'جاري',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
}

const currency = new Intl.NumberFormat('ar-EG')

export function ProjectCard({ project }: { project: Project }) {
  const remaining = project.contractValue - project.spent

  return (
    <article className="project-card">
      <div className="project-card__glow" />

      <header className="project-card__header">
        <div>
          <span className={`project-status project-status--${project.status}`}>{statusLabel[project.status]}</span>
          <h3>{project.name}</h3>
          <p>{project.client}</p>
        </div>
        <button className="project-card__menu" type="button" aria-label={`خيارات ${project.name}`}>
          <MoreHorizontal size={19} />
        </button>
      </header>

      <div className="project-card__meta">
        <span><MapPin size={15} />{project.location}</span>
        <span><UserRound size={15} />{project.manager}</span>
        <span><CalendarDays size={15} />{project.endDate}</span>
      </div>

      <div className="project-progress">
        <div className="project-progress__copy">
          <span>نسبة الإنجاز</span>
          <strong>{project.progress}%</strong>
        </div>
        <div className="project-progress__track" aria-label={`نسبة الإنجاز ${project.progress}%`}>
          <span style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="project-card__finance">
        <div><span>قيمة العقد</span><strong>{currency.format(project.contractValue)}</strong><small>ج.م</small></div>
        <div><span>المقبوض</span><strong>{currency.format(project.received)}</strong><small>ج.م</small></div>
        <div><span>المتبقي</span><strong>{currency.format(remaining)}</strong><small>ج.م</small></div>
      </div>

      <footer className="project-card__footer">
        <div>
          <small>بدأ في</small>
          <strong>{project.startDate}</strong>
        </div>
        <button type="button">فتح المشروع <ArrowUpLeft size={16} /></button>
      </footer>
    </article>
  )
}

import { ArrowUpLeft, FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DashboardProject } from '../types/dashboard.types'

const statusConfig: Record<DashboardProject['status'], { label: string; className: string }> = {
  active: { label: 'جاري', className: 'status-badge--active' },
  paused: { label: 'متوقف', className: 'status-badge--paused' },
  completed: { label: 'مكتمل', className: 'status-badge--completed' },
  archived: { label: 'مؤرشف', className: 'status-badge--archived' },
}

export function RecentProjects({ projects }: { projects: DashboardProject[] }) {
  const navigate = useNavigate()

  return (
    <article className="dashboard-widget recent-projects">
      <header className="widget-header">
        <div>
          <span>نظرة سريعة</span>
          <h2>آخر المشاريع</h2>
        </div>
        <button type="button" onClick={() => navigate('/projects')}>
          عرض الكل <ArrowUpLeft size={15} />
        </button>
      </header>

      <div className="project-list">
        {projects.length === 0 ? (
          <div className="widget-empty-state">
            <FolderOpen size={32} />
            <p>لا توجد مشاريع نشطة حالياً</p>
          </div>
        ) : (
          projects.map((project) => {
            const { label, className } = statusConfig[project.status] ?? statusConfig.active
            return (
              <button
                type="button"
                className="project-row project-row--button"
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                aria-label={`فتح مشروع ${project.name}`}
              >
                <div className="project-main">
                  <strong>{project.name}</strong>
                  <small>{project.client}</small>
                </div>
                <div className="project-progress" aria-label={`نسبة إنجاز ${project.progress}%`}>
                  <div>
                    <span style={{ width: `${project.progress}%` }} />
                  </div>
                  <small>{project.progress}%</small>
                </div>
                <div className="project-balance">
                  <strong>{project.balance}</strong>
                  <small>ج.م</small>
                </div>
                <span className={`status-badge ${className}`}>{label}</span>
              </button>
            )
          })
        )}
      </div>
    </article>
  )
}

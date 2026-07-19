import { ArrowUpLeft } from 'lucide-react'
import { dashboardProjects } from '../data/dashboard.mock'

export function RecentProjects() {
  return (
    <article className="dashboard-widget recent-projects">
      <header className="widget-header">
        <div><span>نظرة سريعة</span><h2>آخر المشاريع</h2></div>
        <button type="button">عرض الكل <ArrowUpLeft size={15} /></button>
      </header>

      <div className="project-list">
        {dashboardProjects.map((project) => (
          <div className="project-row" key={project.name}>
            <div className="project-main">
              <strong>{project.name}</strong>
              <small>{project.client}</small>
            </div>
            <div className="project-progress" aria-label={`نسبة إنجاز ${project.progress}%`}>
              <div><span style={{ width: `${project.progress}%` }} /></div>
              <small>{project.progress}%</small>
            </div>
            <div className="project-balance"><strong>{project.balance}</strong><small>ج.م</small></div>
            <span className="status-badge">{project.status}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

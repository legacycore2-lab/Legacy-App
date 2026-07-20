import { ArrowLeft, FolderKanban } from 'lucide-react'
import type { DashboardProject } from '../types/dashboard.types'
import { PanelEmptyState } from './PanelEmptyState'

function toSafeProgress(progress: number) {
  return Math.min(Math.max(progress, 0), 100)
}

export function CriticalProjectsPanel({ projects }: { projects: DashboardProject[] }) {
  const criticalProjects = projects.filter((project) => project.progress < 70).slice(0, 4)
  const visibleProjects = criticalProjects.length ? criticalProjects : projects.slice(0, 4)

  return (
    <section className="command-panel command-panel--projects">
      <header className="command-panel__header">
        <div>
          <span>متابعة التنفيذ</span>
          <h2>المشاريع الحرجة</h2>
        </div>
        <button type="button">
          عرض الكل <ArrowLeft size={16} />
        </button>
      </header>

      {visibleProjects.length ? (
        <div className="critical-projects">
          {visibleProjects.map((project) => {
            const progress = toSafeProgress(project.progress)

            return (
              <article className="critical-project" key={project.name}>
                <div className="critical-project__topline">
                  <div>
                    <strong>{project.name}</strong>
                    <span>{project.client}</span>
                  </div>
                  <span className="critical-project__status">{project.status}</span>
                </div>
                <div className="critical-project__progress" aria-label={`نسبة الإنجاز ${progress}%`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <footer>
                  <span>{progress}% تنفيذ</span>
                  <strong>{project.balance}</strong>
                </footer>
              </article>
            )
          })}
        </div>
      ) : (
        <PanelEmptyState
          icon={FolderKanban}
          title="لا توجد مشاريع للمتابعة"
          description="ستظهر هنا المشاريع التي تحتاج إلى انتباه عند توفر بيانات التنفيذ."
        />
      )}
    </section>
  )
}

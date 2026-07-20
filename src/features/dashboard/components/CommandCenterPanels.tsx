import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react'
import type { DashboardEntry, DashboardProject } from '../types/dashboard.types'

type Props = {
  projects: DashboardProject[]
  entries: DashboardEntry[]
}

export function CommandCenterPanels({ projects, entries }: Props) {
  const criticalProjects = projects.filter((project) => project.progress < 70).slice(0, 4)
  const activity = entries.slice(0, 4)

  return (
    <div className="command-center-grid">
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

        <div className="critical-projects">
          {(criticalProjects.length ? criticalProjects : projects.slice(0, 4)).map((project) => (
            <article className="critical-project" key={project.name}>
              <div className="critical-project__topline">
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.client}</span>
                </div>
                <span className="critical-project__status">{project.status}</span>
              </div>
              <div className="critical-project__progress">
                <span style={{ width: `${Math.min(Math.max(project.progress, 0), 100)}%` }} />
              </div>
              <footer>
                <span>{project.progress}% تنفيذ</span>
                <strong>{project.balance}</strong>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="command-panel">
        <header className="command-panel__header">
          <div>
            <span>الحركة المالية</span>
            <h2>آخر النشاط</h2>
          </div>
          <Clock3 size={20} />
        </header>

        <div className="activity-feed">
          {activity.map((entry) => (
            <article key={entry.id}>
              <span className={`activity-feed__icon activity-feed__icon--${entry.type}`}>
                {entry.type === 'income' ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
              </span>
              <div>
                <strong>{entry.description}</strong>
                <span>
                  {entry.project} · {entry.date}
                </span>
              </div>
              <b className={`activity-feed__amount activity-feed__amount--${entry.type}`}>{entry.amount}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="command-panel command-panel--tasks">
        <header className="command-panel__header">
          <div>
            <span>أولوية اليوم</span>
            <h2>المهام والتنبيهات</h2>
          </div>
          <span className="command-panel__badge">3</span>
        </header>

        <div className="task-list">
          <article>
            <span className="task-dot task-dot--danger" />
            <div>
              <strong>مراجعة مشروع تجاوز الميزانية</strong>
              <span>قبل الساعة 10:00 ص</span>
            </div>
          </article>
          <article>
            <span className="task-dot task-dot--warning" />
            <div>
              <strong>متابعة دفعة مستحقة من العميل</strong>
              <span>اليوم · مشروع قيد التنفيذ</span>
            </div>
          </article>
          <article>
            <span className="task-dot task-dot--success" />
            <div>
              <strong>اعتماد تقرير المصروفات</strong>
              <span>مراجعة إدارية</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

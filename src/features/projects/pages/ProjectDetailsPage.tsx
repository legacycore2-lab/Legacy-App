import { ArrowRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { JournalView } from '../../journal/components/JournalView'
import { useProjectJournal } from '../../journal/hooks/useProjectJournal'
import '../../journal/styles/journal.css'
import { useProjects } from '../hooks/useProjects'
import '../projects.css'

const statusLabel = {
  active: 'مفتوح',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
}

export function ProjectDetailsPage() {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const { projects, isLoading: isProjectLoading, error: projectError } = useProjects()
  const project = projects.find((item) => item.id === projectId)
  const journal = useProjectJournal(projectId)

  if (isProjectLoading) return <div className="projects-empty">جاري تحميل بيانات المشروع...</div>
  if (projectError) return <div className="projects-empty">{projectError}</div>
  if (!project) return <div className="projects-empty">المشروع غير موجود أو لا تملك صلاحية عرضه.</div>

  return (
    <div>
      <section className="projects-page">
        <header className="projects-hero">
          <div>
            <span className="projects-hero__eyebrow">تفاصيل المشروع</span>
            <h1>{project.name}</h1>
            <p>
              الحالة: {statusLabel[project.status]} · البداية: {project.startDate} · الإغلاق: {project.endDate}
            </p>
          </div>
          <div className="projects-hero__actions">
            <button className="projects-secondary-action" type="button" onClick={() => navigate('/projects')}>
              <ArrowRight size={18} /> العودة للمشاريع
            </button>
          </div>
        </header>
      </section>
      <JournalView {...journal} />
    </div>
  )
}

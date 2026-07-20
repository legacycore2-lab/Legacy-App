import { ArrowRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { JournalView } from '../components/JournalView'
import { useProjectJournal } from '../hooks/useProjectJournal'
import '../styles/journal.css'

const statusLabel = {
  active: 'مفتوح',
  completed: 'مكتمل',
  archived: 'مؤرشف',
}

export function ProjectJournalPage() {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const journal = useProjectJournal(projectId)

  if (journal.isProjectLoading) return <div className="journal-state">جاري تحميل بيانات المشروع...</div>
  if (journal.projectError) return <div className="journal-state journal-error">{journal.projectError}</div>
  if (!journal.project) {
    return <div className="journal-state">المشروع غير موجود أو لا تملك صلاحية عرضه.</div>
  }

  return (
    <div>
      <section className="journal-page">
        <header className="journal-header">
          <div>
            <span>تفاصيل المشروع</span>
            <h1>{journal.project.name}</h1>
            <p>
              الحالة: {statusLabel[journal.project.status]} · البداية: {journal.project.startDate} · الإغلاق:{' '}
              {journal.project.endDate}
            </p>
          </div>
          <button type="button" className="journal-primary" onClick={() => navigate('/projects')}>
            <ArrowRight size={18} /> العودة للمشاريع
          </button>
        </header>
      </section>
      <JournalView {...journal} />
    </div>
  )
}

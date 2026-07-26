import { BriefcaseBusiness, Plus } from 'lucide-react'
import { useState } from 'react'
import { ExcelImportDialog } from '../components/ExcelImportDialog'
import { ProjectCreateDialog } from '../components/ProjectCreateDialog'
import { ProjectsStats } from '../components/ProjectsStats'
import { ProjectsToolbar } from '../components/ProjectsToolbar'
import { ProjectsWorkspace } from '../components/ProjectsWorkspace'
import { useProjectCreateForm } from '../hooks/useProjectCreateForm'
import { useProjects } from '../hooks/useProjects'
import '../excel-import.css'
import '../project-create.css'
import '../projects.css'

export function ProjectsPage() {
  const { projectRows, summary, query, setQuery, status, setStatus, isLoading, error } = useProjects()
  const projectCreate = useProjectCreateForm()
  const [importOpen, setImportOpen] = useState(false)

  return (
    <section className="projects-page">
      <header className="projects-hero">
        <div>
          <span className="projects-hero__eyebrow">مركز إدارة المشاريع</span>
          <h1>المشاريع</h1>
          <p>صورة لحظية للمشروعات والتنفيذ والسيولة من شاشة واحدة.</p>
        </div>
        <div className="projects-hero__actions">
          <button className="projects-secondary-action" type="button" onClick={() => setImportOpen(true)}>
            استيراد Excel
          </button>
          <button className="projects-primary-action" type="button" onClick={projectCreate.open}>
            <Plus size={18} /> مشروع جديد
          </button>
        </div>
      </header>

      <ProjectsStats summary={summary} />
      <ProjectsToolbar query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />

      {isLoading && <div className="projects-empty">جاري تحميل المشاريع...</div>}
      {error && <div className="projects-empty">{error}</div>}
      {!isLoading && !error && projectRows.length > 0 ? (
        <ProjectsWorkspace projects={projectRows} onEdit={projectCreate.edit} />
      ) : !isLoading && !error ? (
        <div className="projects-empty">
          <BriefcaseBusiness size={28} />
          <h3>لا توجد مشاريع مطابقة</h3>
          <p>جرّب تغيير كلمة البحث أو حالة المشروع.</p>
        </div>
      ) : null}

      <ProjectCreateDialog {...projectCreate} />
      <ExcelImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  )
}

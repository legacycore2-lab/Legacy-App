import { BriefcaseBusiness, Plus } from 'lucide-react'
import { useState } from 'react'
import { ExcelImportDialog } from '../components/ExcelImportDialog'
import { ProjectCreateDialog } from '../components/ProjectCreateDialog'
import { ProjectsStats } from '../components/ProjectsStats'
import { ProjectsTable } from '../components/ProjectsTable'
import { ProjectsToolbar } from '../components/ProjectsToolbar'
import { useProjectCreateForm } from '../hooks/useProjectCreateForm'
import { useProjects } from '../hooks/useProjects'
import '../excel-import.css'
import '../project-create.css'
import '../projects-table.css'
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
          <p>متابعة التنفيذ والتدفقات المالية واستيراد البيانات من مكان واحد.</p>
        </div>
        <div className="projects-hero__actions">
          <button className="projects-secondary-action" type="button" onClick={() => setImportOpen(true)}>
            استيراد من Excel
          </button>
          <button className="projects-primary-action" type="button" onClick={projectCreate.open}>
            <Plus size={18} /> مشروع جديد
          </button>
        </div>
      </header>
      <ProjectsStats summary={summary} />
      {isLoading && <div className="projects-empty">جاري تحميل المشاريع...</div>}
      {error && <div className="projects-empty">{error}</div>}
      <ProjectsToolbar query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />
      <div className="projects-section-heading">
        <div>
          <span>المحفظة الحالية</span>
          <h2>كل المشاريع</h2>
        </div>
        <small>{projectRows.length} مشروع</small>
      </div>
      {!isLoading && !error && projectRows.length > 0 ? (
        <ProjectsTable projects={projectRows} />
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

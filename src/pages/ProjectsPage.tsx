import { useState } from 'react'
import { BriefcaseBusiness, Plus } from 'lucide-react'
import { ExcelImportDialog } from '../features/projects/components/ExcelImportDialog'
import { ProjectsStats } from '../features/projects/components/ProjectsStats'
import { ProjectsTable } from '../features/projects/components/ProjectsTable'
import { ProjectsToolbar } from '../features/projects/components/ProjectsToolbar'
import { useProjects } from '../features/projects/hooks/useProjects'
import '../features/projects/projects.css'
import '../features/projects/projects-table.css'
import '../features/projects/excel-import.css'

export function ProjectsPage() {
  const { projects, filteredProjects, query, setQuery, status, setStatus, isLoading, error } = useProjects()
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
          <button className="projects-primary-action" type="button">
            <Plus size={18} />
            مشروع جديد
          </button>
        </div>
      </header>

      <ProjectsStats projects={projects} />

      {isLoading && <div className="projects-empty">جاري تحميل المشاريع...</div>}
      {error && <div className="projects-empty">{error}</div>}

      <ProjectsToolbar
        query={query}
        status={status}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
      />

      <div className="projects-section-heading">
        <div>
          <span>المحفظة الحالية</span>
          <h2>كل المشاريع</h2>
        </div>
        <small>{filteredProjects.length} مشروع</small>
      </div>

      {!isLoading && !error && filteredProjects.length > 0 ? (
        <ProjectsTable projects={filteredProjects} />
      ) : !isLoading && !error ? (
        <div className="projects-empty">
          <BriefcaseBusiness size={28} />
          <h3>لا توجد مشاريع مطابقة</h3>
          <p>جرّب تغيير كلمة البحث أو حالة المشروع.</p>
        </div>
      ) : null}

      <ExcelImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  )
}

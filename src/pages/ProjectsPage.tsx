import { useMemo, useState } from 'react'
import { BriefcaseBusiness, Plus } from 'lucide-react'
import { ExcelImportDialog } from '../features/projects/components/ExcelImportDialog'
import { ProjectsStats } from '../features/projects/components/ProjectsStats'
import { ProjectsTable } from '../features/projects/components/ProjectsTable'
import { ProjectsToolbar } from '../features/projects/components/ProjectsToolbar'
import { projectsMock } from '../features/projects/data/projects.mock'
import type { ProjectStatusFilter } from '../features/projects/types/project.types'
import '../features/projects/projects.css'
import '../features/projects/projects-table.css'

export function ProjectsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')
  const [importOpen, setImportOpen] = useState(false)

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return projectsMock.filter((project) => {
      const matchesStatus = status === 'all' || project.status === status
      const matchesQuery = !normalizedQuery || [project.name, project.client, project.location, project.manager]
        .some((value) => value.toLowerCase().includes(normalizedQuery))

      return matchesStatus && matchesQuery
    })
  }, [query, status])

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

      <ProjectsStats projects={projectsMock} />

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

      {filteredProjects.length > 0 ? (
        <ProjectsTable projects={filteredProjects} />
      ) : (
        <div className="projects-empty">
          <BriefcaseBusiness size={28} />
          <h3>لا توجد مشاريع مطابقة</h3>
          <p>جرّب تغيير كلمة البحث أو حالة المشروع.</p>
        </div>
      )}

      <ExcelImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  )
}

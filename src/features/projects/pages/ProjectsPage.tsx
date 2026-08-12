import { BriefcaseBusiness, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExcelImportDialog } from '../components/ExcelImportDialog'
import { ProjectCreateDialog } from '../components/ProjectCreateDialog'
import { ProjectsStats } from '../components/ProjectsStats'
import { ProjectsTable } from '../components/ProjectsTable'
import { ProjectsToolbar } from '../components/ProjectsToolbar'
import { useProjectCreateForm } from '../hooks/useProjectCreateForm'
import { useProjectPermissions } from '../hooks/useProjectPermissions'
import { useProjects } from '../hooks/useProjects'
import '../styles/excel-import.css'
import '../styles/project-create.css'
import '../styles/projects-table.css'
import '../styles/projects.css'

const number = new Intl.NumberFormat('ar-EG')

export function ProjectsPage() {
  const {
    projectRows,
    summary,
    totalCount,
    page,
    totalPages,
    query,
    setQuery,
    status,
    setStatus,
    previousPage,
    nextPage,
    isLoading,
    isRefreshing,
    error,
  } = useProjects()
  const projectCreate = useProjectCreateForm()
  const { canCreate, canEdit } = useProjectPermissions()
  const [importOpen, setImportOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    if (canCreate) projectCreate.open()

    const next = new URLSearchParams(searchParams)
    next.delete('create')
    setSearchParams(next, { replace: true })
  }, [canCreate, projectCreate, searchParams, setSearchParams])

  return (
    <section className="projects-page">
      <header className="projects-hero">
        <div>
          <span className="projects-hero__eyebrow">مركز إدارة المشاريع</span>
          <h1>المشاريع</h1>
          <p>متابعة التنفيذ والتدفقات المالية واستيراد البيانات من مكان واحد.</p>
        </div>
        {canCreate && (
          <div className="projects-hero__actions">
            <button className="projects-secondary-action" type="button" onClick={() => setImportOpen(true)}>
              استيراد من Excel
            </button>
            <button className="projects-primary-action" type="button" onClick={projectCreate.open}>
              <Plus size={18} /> مشروع جديد
            </button>
          </div>
        )}
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
        <small>{number.format(totalCount)} مشروع</small>
      </div>
      {!isLoading && !error && projectRows.length > 0 ? (
        <>
          <ProjectsTable projects={projectRows} onEdit={projectCreate.edit} canEdit={canEdit} />
          <nav className="projects-pagination" aria-label="صفحات المشاريع">
            <button type="button" onClick={previousPage} disabled={page <= 1 || isRefreshing}>
              السابق
            </button>
            <span>
              صفحة {number.format(page)} من {number.format(totalPages)}
              {isRefreshing ? ' · جاري التحديث' : ''}
            </span>
            <button type="button" onClick={nextPage} disabled={page >= totalPages || isRefreshing}>
              التالي
            </button>
          </nav>
        </>
      ) : !isLoading && !error ? (
        <div className="projects-empty">
          <BriefcaseBusiness size={28} />
          <h3>لا توجد مشاريع مطابقة</h3>
          <p>جرّب تغيير كلمة البحث أو حالة المشروع.</p>
        </div>
      ) : null}
      {canCreate && <ProjectCreateDialog {...projectCreate} />}
      {canCreate && <ExcelImportDialog open={importOpen} onClose={() => setImportOpen(false)} />}
    </section>
  )
}

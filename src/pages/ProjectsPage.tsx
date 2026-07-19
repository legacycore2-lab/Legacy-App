import { useMemo, useState } from 'react'
import { Archive, BriefcaseBusiness, CirclePause, CircleCheckBig, Plus, TrendingUp } from 'lucide-react'
import { ExcelImportDialog } from '../features/projects/components/ExcelImportDialog'
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

  const totalContracts = projectsMock.reduce((total, project) => total + project.contractValue, 0)
  const totalProfit = projectsMock.reduce((total, project) => total + (project.received - project.spent), 0)
  const number = new Intl.NumberFormat('ar-EG')
  const stats = [
    { label: 'إجمالي المشاريع', value: projectsMock.length, icon: BriefcaseBusiness, tone: 'green' },
    { label: 'المشاريع الجارية', value: projectsMock.filter((project) => project.status === 'active').length, icon: TrendingUp, tone: 'blue' },
    { label: 'المشاريع المكتملة', value: projectsMock.filter((project) => project.status === 'completed').length, icon: CircleCheckBig, tone: 'gold' },
    { label: 'المشاريع المتوقفة', value: projectsMock.filter((project) => project.status === 'paused').length, icon: CirclePause, tone: 'red' },
    { label: 'قيمة العقود', value: number.format(totalContracts), icon: Archive, tone: 'purple', suffix: 'ج.م' },
    { label: 'صافي السيولة', value: number.format(totalProfit), icon: TrendingUp, tone: 'teal', suffix: 'ج.م' },
  ]

  return <section className="projects-page">
    <header className="projects-hero"><div><span className="projects-hero__eyebrow">مركز إدارة المشاريع</span><h1>المشاريع</h1><p>متابعة التنفيذ والتدفقات المالية واستيراد البيانات من مكان واحد.</p></div><div className="projects-hero__actions"><button className="projects-secondary-action" type="button" onClick={() => setImportOpen(true)}>استيراد من Excel</button><button className="projects-primary-action" type="button"><Plus size={18}/> مشروع جديد</button></div></header>
    <div className="projects-stats">{stats.map(({ label, value, icon: Icon, tone, suffix }) => <article className={`projects-stat projects-stat--${tone}`} key={label}><span className="projects-stat__icon"><Icon size={20}/></span><div><small>{label}</small><strong>{value}</strong>{suffix && <span>{suffix}</span>}</div></article>)}</div>
    <ProjectsToolbar query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/>
    <div className="projects-section-heading"><div><span>المحفظة الحالية</span><h2>كل المشاريع</h2></div><small>{filteredProjects.length} مشروع</small></div>
    {filteredProjects.length ? <ProjectsTable projects={filteredProjects}/> : <div className="projects-empty"><BriefcaseBusiness size={28}/><h3>لا توجد مشاريع مطابقة</h3><p>جرّب تغيير كلمة البحث أو حالة المشروع.</p></div>}
    <ExcelImportDialog open={importOpen} onClose={() => setImportOpen(false)}/>
  </section>
}

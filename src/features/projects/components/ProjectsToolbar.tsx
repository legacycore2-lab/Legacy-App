import { Filter, Grid2X2, Search, SlidersHorizontal } from 'lucide-react'
import type { ProjectStatusFilter } from '../types/project.types'

type ProjectsToolbarProps = {
  query: string
  status: ProjectStatusFilter
  onQueryChange: (value: string) => void
  onStatusChange: (value: ProjectStatusFilter) => void
}

export function ProjectsToolbar({ query, status, onQueryChange, onStatusChange }: ProjectsToolbarProps) {
  return (
    <div className="projects-toolbar">
      <label className="projects-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="ابحث عن مشروع، عميل أو موقع..."
        />
      </label>

      <label className="projects-filter">
        <Filter size={17} />
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ProjectStatusFilter)}>
          <option value="all">كل الحالات</option>
          <option value="active">المشاريع الجارية</option>
          <option value="completed">المشاريع المكتملة</option>
          <option value="paused">المشاريع المتوقفة</option>
          <option value="archived">المشاريع المؤرشفة</option>
        </select>
      </label>

      <button className="projects-toolbar__button" type="button"><SlidersHorizontal size={17} /> تصفية متقدمة</button>
      <button className="projects-view-button is-active" type="button" aria-label="عرض الكروت"><Grid2X2 size={18} /></button>
    </div>
  )
}

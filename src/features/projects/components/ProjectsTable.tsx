import { Pencil } from 'lucide-react'
import type { ProjectRow } from '../types/project.types'

type Props = {
  projects: ProjectRow[]
  onEdit: (project: ProjectRow) => void
}

const money = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })
const statusLabel = { active: 'مفتوح', completed: 'مكتمل', paused: 'متوقف', archived: 'مؤرشف' }

export function ProjectsTable({ projects, onEdit }: Props) {
  return (
    <div className="projects-table-shell">
      <div className="projects-table-scroll">
        <table className="projects-table">
          <thead>
            <tr>
              <th>المشروع</th>
              <th>العميل</th>
              <th>المقبوض</th>
              <th>المصروف</th>
              <th>الرصيد</th>
              <th>التنفيذ</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              return (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <small>{project.location}</small>
                  </td>
                  <td>{project.client}</td>
                  <td className="money-positive">{money.format(project.received)} ج.م</td>
                  <td>{money.format(project.spent)} ج.م</td>
                  <td className={project.balance < 0 ? 'money-negative' : 'money-positive'}>
                    {project.balance > 0 ? '+' : ''}
                    {money.format(project.balance)} ج.م
                  </td>
                  <td>
                    <div className="table-progress">
                      <span style={{ width: `${project.progress}%` }} />
                      <b>{project.progress}%</b>
                    </div>
                  </td>
                  <td>
                    <span className={`project-status project-status--${project.status}`}>
                      {statusLabel[project.status]}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" title="تعديل المشروع" onClick={() => onEdit(project)}>
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

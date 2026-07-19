import { Eye, MoreHorizontal, Pencil } from 'lucide-react'
import type { Project } from '../types/project.types'

type Props = { projects: Project[] }

const money = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })
const statusLabel = { active: 'مفتوح', completed: 'مكتمل', paused: 'متوقف', archived: 'مؤرشف' }

export function ProjectsTable({ projects }: Props) {
  return (
    <div className="projects-table-shell">
      <div className="projects-table-scroll">
        <table className="projects-table">
          <thead><tr><th>المشروع</th><th>العميل</th><th>المقبوض</th><th>المصروف</th><th>الرصيد</th><th>التنفيذ</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {projects.map((project) => {
              const balance = project.received - project.spent
              return <tr key={project.id}>
                <td><strong>{project.name}</strong><small>{project.location}</small></td>
                <td>{project.client}</td>
                <td className="money-positive">{money.format(project.received)} ج.م</td>
                <td>{money.format(project.spent)} ج.م</td>
                <td className={balance < 0 ? 'money-negative' : 'money-positive'}>{balance > 0 ? '+' : ''}{money.format(balance)} ج.م</td>
                <td><div className="table-progress"><span style={{ width: `${project.progress}%` }} /><b>{project.progress}%</b></div></td>
                <td><span className={`project-status project-status--${project.status}`}>{statusLabel[project.status]}</span></td>
                <td><div className="table-actions"><button title="عرض"><Eye size={16}/></button><button title="تعديل"><Pencil size={16}/></button><button title="المزيد"><MoreHorizontal size={16}/></button></div></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

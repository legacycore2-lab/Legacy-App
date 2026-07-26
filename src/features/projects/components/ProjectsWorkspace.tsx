import {
  ArrowUpLeft,
  Banknote,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  MapPin,
  Pencil,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectRow } from '../types/project.types'

type Props = {
  projects: ProjectRow[]
  onEdit: (project: ProjectRow) => void
}

const money = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })
const statusLabel = { active: 'نشط', completed: 'مكتمل', paused: 'متوقف', archived: 'مؤرشف' }

function formatMoney(value: number) {
  return `${money.format(value)} ج.م`
}

export function ProjectsWorkspace({ projects, onEdit }: Props) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string>('')

  // Derive the selected project without an effect:
  // prefer the user's pick if it still exists; otherwise fall back to the first project.
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0]

  if (!selected) return null

  return (
    <div className="projects-workspace">
      <section className="projects-workspace__portfolio" aria-label="محفظة المشاريع">
        <div className="projects-cards-grid">
          {projects.map((project) => (
            <article
              key={project.id}
              className={`project-card ${project.id === selected.id ? 'project-card--selected' : ''}`}
              onClick={() => setSelectedId(project.id)}
            >
              <div className="project-card__topline">
                <span className={`project-status project-status--${project.status}`}>
                  {statusLabel[project.status]}
                </span>
                <span className="project-card__code">{project.code || 'بدون كود'}</span>
              </div>

              <div className="project-card__title">
                <span className="project-card__icon">
                  <Building2 size={18} />
                </span>
                <div>
                  <h3>{project.name}</h3>
                  <p>
                    <MapPin size={13} /> {project.location || 'لم يحدد الموقع'}
                  </p>
                </div>
              </div>

              <div className="project-card__progress-head">
                <span>نسبة التنفيذ</span>
                <strong>{project.progress}%</strong>
              </div>
              <div className="project-card__progress" aria-label={`نسبة التنفيذ ${project.progress}%`}>
                <span style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} />
              </div>

              <div className="project-card__money">
                <div>
                  <span>قيمة العقد</span>
                  <strong>{formatMoney(project.contractValue)}</strong>
                </div>
                <div>
                  <span>الرصيد</span>
                  <strong className={project.balance < 0 ? 'is-negative' : ''}>
                    {formatMoney(project.balance)}
                  </strong>
                </div>
              </div>

              <footer className="project-card__footer">
                <span>
                  <UserRound size={14} /> {project.manager || project.client || 'غير محدد'}
                </span>
                <button
                  type="button"
                  aria-label={`عرض ${project.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    navigate(`/projects/${project.id}`)
                  }}
                >
                  <ChevronLeft size={17} />
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <aside className="project-inspector" aria-label="تفاصيل المشروع المحدد">
        <div className="project-inspector__cover">
          <div className="project-inspector__cover-actions">
            <button type="button" title="تعديل المشروع" onClick={() => onEdit(selected)}>
              <Pencil size={16} />
            </button>
          </div>
          <span className={`project-status project-status--${selected.status}`}>
            {statusLabel[selected.status]}
          </span>
          <h2>{selected.name}</h2>
          <p>
            <MapPin size={14} /> {selected.location || 'لم يحدد الموقع'}
          </p>
        </div>

        <div className="project-inspector__body">
          <div className="project-inspector__progress">
            <div>
              <span>التقدم الكلي</span>
              <strong>{selected.progress}%</strong>
            </div>
            <div className="project-inspector__track">
              <span style={{ width: `${selected.progress}%` }} />
            </div>
          </div>

          <div className="project-inspector__metrics">
            <div>
              <CircleDollarSign size={18} />
              <span>قيمة العقد</span>
              <strong>{formatMoney(selected.contractValue)}</strong>
            </div>
            <div>
              <Banknote size={18} />
              <span>المقبوض</span>
              <strong>{formatMoney(selected.received)}</strong>
            </div>
            <div>
              <WalletCards size={18} />
              <span>المصروف</span>
              <strong>{formatMoney(selected.spent)}</strong>
            </div>
            <div>
              <CalendarDays size={18} />
              <span>تاريخ البدء</span>
              <strong>{selected.startDate || '—'}</strong>
            </div>
          </div>

          <div className="project-inspector__balance">
            <div>
              <span>الرصيد الحالي</span>
              <strong className={selected.balance < 0 ? 'is-negative' : ''}>
                {formatMoney(selected.balance)}
              </strong>
            </div>
            <ArrowUpLeft size={22} />
          </div>

          <button
            className="project-inspector__open"
            type="button"
            onClick={() => navigate(`/projects/${selected.id}`)}
          >
            فتح ملف المشروع
            <ChevronLeft size={18} />
          </button>
        </div>
      </aside>
    </div>
  )
}

import { ArrowRight, BriefcaseBusiness, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectDetails } from '../hooks/useProjectDetails'
import '../project-details.css'

const money = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const statusLabel: Record<string, string> = {
  active: 'جاري',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
}

const statusClass: Record<string, string> = {
  active: 'project-details-status--active',
  completed: 'project-details-status--completed',
  paused: 'project-details-status--paused',
  archived: 'project-details-status--archived',
}

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { details, isLoading, error } = useProjectDetails(id ?? null)

  if (isLoading) {
    return <div className="project-details-state">جارٍ تحميل تفاصيل المشروع...</div>
  }

  if (error) {
    return <div className="project-details-state project-details-state--error">{error}</div>
  }

  if (!details) {
    return <div className="project-details-state">المشروع غير موجود.</div>
  }

  const { project, entries, summary } = details

  return (
    <section className="project-details-page">
      {/* Header */}
      <header className="project-details-header">
        <button type="button" className="project-details-back" onClick={() => navigate('/projects')}>
          <ArrowRight size={16} />
          المشاريع
        </button>
        <div className="project-details-title">
          <div>
            <span className="project-details-eyebrow">
              {project.code || 'بدون كود'} — {project.client || 'بدون عميل'}
            </span>
            <h1>{project.name}</h1>
          </div>
          <span className={`project-details-status ${statusClass[project.status] ?? ''}`}>
            {statusLabel[project.status]}
          </span>
        </div>
      </header>

      {/* KPIs */}
      <div className="project-details-kpis">
        <article className="project-details-kpi project-details-kpi--income">
          <TrendingUp size={20} />
          <div>
            <span>إجمالي الإيرادات</span>
            <strong>{money.format(summary.totalIncome)} ج.م</strong>
          </div>
        </article>
        <article className="project-details-kpi project-details-kpi--expense">
          <TrendingDown size={20} />
          <div>
            <span>إجمالي المصروفات</span>
            <strong>{money.format(summary.totalExpense)} ج.م</strong>
          </div>
        </article>
        <article
          className={`project-details-kpi ${summary.balance >= 0 ? 'project-details-kpi--positive' : 'project-details-kpi--negative'}`}
        >
          <Wallet size={20} />
          <div>
            <span>الصافي</span>
            <strong>{money.format(summary.balance)} ج.م</strong>
          </div>
        </article>
        <article className="project-details-kpi project-details-kpi--neutral">
          <BriefcaseBusiness size={20} />
          <div>
            <span>عدد القيود</span>
            <strong>{summary.entryCount}</strong>
          </div>
        </article>
      </div>

      {/* Project Info */}
      <div className="project-details-info">
        <dl>
          {project.manager && (
            <div>
              <dt>المدير</dt>
              <dd>{project.manager}</dd>
            </div>
          )}
          {project.location && (
            <div>
              <dt>الموقع</dt>
              <dd>{project.location}</dd>
            </div>
          )}
          {project.startDate && (
            <div>
              <dt>تاريخ البدء</dt>
              <dd>{project.startDate}</dd>
            </div>
          )}
          {project.endDate && (
            <div>
              <dt>تاريخ الانتهاء</dt>
              <dd>{project.endDate}</dd>
            </div>
          )}
          {project.contractValue > 0 && (
            <div>
              <dt>قيمة العقد</dt>
              <dd>{money.format(project.contractValue)} ج.م</dd>
            </div>
          )}
          <div>
            <dt>نسبة الإنجاز</dt>
            <dd>
              <div className="project-details-progress">
                <div className="project-details-progress__bar">
                  <div className="project-details-progress__fill" style={{ width: `${project.progress}%` }} />
                </div>
                <span>{project.progress}%</span>
              </div>
            </dd>
          </div>
        </dl>
        {project.notes && <p className="project-details-notes">{project.notes}</p>}
      </div>

      {/* Entries */}
      <div className="project-details-entries">
        <div className="project-details-entries__heading">
          <h2>القيود المرتبطة</h2>
          <small>{summary.entryCount} قيد</small>
        </div>

        {entries.length === 0 ? (
          <div className="project-details-empty">
            <BriefcaseBusiness size={24} />
            <p>لا توجد قيود مرتبطة بهذا المشروع.</p>
          </div>
        ) : (
          <table className="project-details-table">
            <thead>
              <tr>
                <th>#</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>البند</th>
                <th>البيان</th>
                <th>المقاول</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={`project-details-row--${entry.type}`}>
                  <td>{entry.seq ? `#${entry.seq}` : '—'}</td>
                  <td>{entry.entryDate}</td>
                  <td>
                    <span className={`project-details-badge project-details-badge--${entry.type}`}>
                      {entry.type === 'income' ? 'إيراد' : 'مصروف'}
                    </span>
                  </td>
                  <td>{entry.category || '—'}</td>
                  <td>{entry.description || '—'}</td>
                  <td>{entry.contractor || '—'}</td>
                  <td className={`project-details-amount--${entry.type}`}>
                    {money.format(entry.amount)} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

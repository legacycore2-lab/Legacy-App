import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  FileText,
  MapPin,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectDetails } from '../hooks/useProjectDetails'
import '../project-details.css'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

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

function CurrencyValue({ value }: { value: number }) {
  return (
    <bdi className="project-details-currency" dir="ltr">
      {money.format(value)}
    </bdi>
  )
}

function getProgressTone(progress: number) {
  if (progress >= 70) return 'project-details-progress--high'
  if (progress >= 30) return 'project-details-progress--medium'
  return 'project-details-progress--low'
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
  const progress = Math.min(100, Math.max(0, project.progress))

  return (
    <section className="project-details-page">
      <header className="project-details-header">
        <button type="button" className="project-details-back" onClick={() => navigate('/projects')}>
          <ArrowRight size={16} />
          المشاريع
        </button>

        <div className="project-details-title-row">
          <div className="project-details-title-copy">
            <span className="project-details-eyebrow">
              {project.code || 'بدون كود'} — {project.client || 'بدون عميل'}
            </span>
            <div className="project-details-title">
              <h1>{project.name}</h1>
              <span className={`project-details-status ${statusClass[project.status] ?? ''}`}>
                {statusLabel[project.status] ?? project.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="project-details-kpis">
        <article className="project-details-kpi project-details-kpi--income">
          <span className="project-details-kpi__icon">
            <TrendingUp size={20} />
          </span>
          <div>
            <span>إجمالي الإيرادات</span>
            <strong>
              <CurrencyValue value={summary.totalIncome} />
            </strong>
          </div>
        </article>

        <article className="project-details-kpi project-details-kpi--expense">
          <span className="project-details-kpi__icon">
            <TrendingDown size={20} />
          </span>
          <div>
            <span>إجمالي المصروفات</span>
            <strong>
              <CurrencyValue value={summary.totalExpense} />
            </strong>
          </div>
        </article>

        <article
          className={`project-details-kpi ${summary.balance >= 0 ? 'project-details-kpi--positive' : 'project-details-kpi--negative'}`}
        >
          <span className="project-details-kpi__icon">
            <Wallet size={20} />
          </span>
          <div>
            <span>الصافي</span>
            <strong>
              <CurrencyValue value={summary.balance} />
            </strong>
          </div>
        </article>

        <article className="project-details-kpi project-details-kpi--neutral">
          <span className="project-details-kpi__icon">
            <BriefcaseBusiness size={20} />
          </span>
          <div>
            <span>عدد القيود</span>
            <strong className="project-details-number">{summary.entryCount}</strong>
          </div>
        </article>
      </div>

      <div className="project-details-overview">
        <article className="project-details-info">
          <div className="project-details-section-heading">
            <div>
              <span>ملخص المشروع</span>
              <h2>بيانات المشروع</h2>
            </div>
            <FileText size={20} />
          </div>

          <dl>
            {project.manager && (
              <div>
                <dt>
                  <UserRound size={15} />
                  المدير
                </dt>
                <dd>{project.manager}</dd>
              </div>
            )}
            {project.location && (
              <div>
                <dt>
                  <MapPin size={15} />
                  الموقع
                </dt>
                <dd>{project.location}</dd>
              </div>
            )}
            {project.startDate && (
              <div>
                <dt>
                  <CalendarDays size={15} />
                  تاريخ البدء
                </dt>
                <dd className="project-details-date" dir="ltr">
                  {project.startDate}
                </dd>
              </div>
            )}
            {project.endDate && (
              <div>
                <dt>
                  <CalendarDays size={15} />
                  تاريخ الانتهاء
                </dt>
                <dd className="project-details-date" dir="ltr">
                  {project.endDate}
                </dd>
              </div>
            )}
            {project.contractValue > 0 && (
              <div>
                <dt>
                  <CircleDollarSign size={15} />
                  قيمة العقد
                </dt>
                <dd>
                  <CurrencyValue value={project.contractValue} />
                </dd>
              </div>
            )}
          </dl>

          {project.notes && <p className="project-details-notes">{project.notes}</p>}
        </article>

        <article className={`project-details-progress-card ${getProgressTone(progress)}`}>
          <div className="project-details-section-heading">
            <div>
              <span>حالة التنفيذ</span>
              <h2>نسبة الإنجاز</h2>
            </div>
            <strong className="project-details-progress-value">{progress}%</strong>
          </div>
          <div className="project-details-progress__bar" aria-label={`نسبة الإنجاز ${progress}%`}>
            <div className="project-details-progress__fill" style={{ width: `${progress}%` }} />
          </div>
          <p>تم إنجاز {progress}% من الأعمال المسجلة للمشروع.</p>
        </article>
      </div>

      <div className="project-details-entries">
        <div className="project-details-entries__heading">
          <div>
            <span>الحركة المالية</span>
            <h2>القيود المرتبطة</h2>
          </div>
          <small>{summary.entryCount} قيد</small>
        </div>

        {entries.length === 0 ? (
          <div className="project-details-empty">
            <BriefcaseBusiness size={24} />
            <p>لا توجد قيود مرتبطة بهذا المشروع.</p>
          </div>
        ) : (
          <div className="project-details-table-scroll">
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
                    <td className="project-details-seq">{entry.seq ? `#${entry.seq}` : '—'}</td>
                    <td className="project-details-date" dir="ltr">
                      {entry.entryDate}
                    </td>
                    <td>
                      <span className={`project-details-badge project-details-badge--${entry.type}`}>
                        {entry.type === 'income' ? 'إيراد' : 'مصروف'}
                      </span>
                    </td>
                    <td>{entry.category || '—'}</td>
                    <td className="project-details-description">{entry.description || '—'}</td>
                    <td>{entry.contractor || '—'}</td>
                    <td className={`project-details-amount project-details-amount--${entry.type}`}>
                      <CurrencyValue value={entry.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

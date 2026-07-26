import type { CSSProperties } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileBarChart,
  FileText,
  MapPin,
  Plus,
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

function CurrencyValue({ value }: { value: number }) {
  return (
    <bdi className="project-v2-currency" dir="ltr">
      {money.format(value)}
    </bdi>
  )
}

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { details, isLoading, error } = useProjectDetails(id ?? null)

  if (isLoading) return <div className="project-v2-state">جارٍ تحميل تفاصيل المشروع...</div>
  if (error) return <div className="project-v2-state project-v2-state--error">{error}</div>
  if (!details) return <div className="project-v2-state">المشروع غير موجود.</div>

  const { project, entries, summary } = details
  const progress = Math.min(100, Math.max(0, project.progress))
  const progressStyle = { '--project-progress': `${progress * 3.6}deg` } as CSSProperties

  return (
    <section className="project-v2-page">
      <button type="button" className="project-v2-back" onClick={() => navigate('/projects')}>
        <ArrowRight size={16} />
        العودة إلى المشاريع
      </button>

      <div className="project-v2-hero">
        <div className="project-v2-hero__content">
          <div className="project-v2-hero__identity">
            <span className="project-v2-hero__icon">
              <Building2 size={28} />
            </span>

            <div>
              <div className="project-v2-hero__title-row">
                <h1>{project.name}</h1>
                <span className={`project-v2-status project-v2-status--${project.status}`}>
                  {statusLabel[project.status] ?? project.status}
                </span>
              </div>

              <p>
                {project.code || 'بدون كود'} · {project.client || 'بدون عميل'}
              </p>

              <div className="project-v2-hero__meta">
                <span>
                  <MapPin size={15} />
                  {project.location || 'الموقع غير محدد'}
                </span>
                <span>
                  <CalendarDays size={15} />
                  <bdi dir="ltr">{project.startDate || 'تاريخ البدء غير محدد'}</bdi>
                </span>
                <span>
                  <UserRound size={15} />
                  {project.manager || 'المدير غير محدد'}
                </span>
              </div>
            </div>
          </div>

          <div className="project-v2-actions">
            <button type="button" className="project-v2-action project-v2-action--ghost">
              <FileBarChart size={17} />
              تقرير المشروع
            </button>
            <button
              type="button"
              className="project-v2-action project-v2-action--primary"
              onClick={() => navigate('/journal')}
            >
              <Plus size={17} />
              إضافة قيد
            </button>
          </div>
        </div>
      </div>

      <div className="project-v2-layout">
        <div className="project-v2-main">
          <div className="project-v2-kpis">
            <article className="project-v2-kpi project-v2-kpi--contract">
              <span className="project-v2-kpi__icon">
                <CircleDollarSign size={21} />
              </span>
              <div>
                <span>قيمة العقد</span>
                <strong>
                  <CurrencyValue value={project.contractValue} />
                </strong>
              </div>
            </article>

            <article className="project-v2-kpi project-v2-kpi--income">
              <span className="project-v2-kpi__icon">
                <TrendingUp size={21} />
              </span>
              <div>
                <span>الإيرادات</span>
                <strong>
                  <CurrencyValue value={summary.totalIncome} />
                </strong>
              </div>
            </article>

            <article className="project-v2-kpi project-v2-kpi--expense">
              <span className="project-v2-kpi__icon">
                <TrendingDown size={21} />
              </span>
              <div>
                <span>المصروفات</span>
                <strong>
                  <CurrencyValue value={summary.totalExpense} />
                </strong>
              </div>
            </article>

            <article
              className={`project-v2-kpi ${summary.balance >= 0 ? 'project-v2-kpi--balance' : 'project-v2-kpi--expense'}`}
            >
              <span className="project-v2-kpi__icon">
                <Wallet size={21} />
              </span>
              <div>
                <span>الصافي</span>
                <strong>
                  <CurrencyValue value={summary.balance} />
                </strong>
              </div>
            </article>
          </div>

          <article className="project-v2-card project-v2-info-card">
            <div className="project-v2-card__heading">
              <div>
                <span>المعلومات الأساسية</span>
                <h2>بيانات المشروع</h2>
              </div>
              <FileText size={20} />
            </div>

            <dl className="project-v2-info-grid">
              <div>
                <dt>العميل</dt>
                <dd>{project.client || '—'}</dd>
              </div>
              <div>
                <dt>مدير المشروع</dt>
                <dd>{project.manager || '—'}</dd>
              </div>
              <div>
                <dt>الموقع</dt>
                <dd>{project.location || '—'}</dd>
              </div>
              <div>
                <dt>تاريخ البدء</dt>
                <dd dir="ltr">{project.startDate || '—'}</dd>
              </div>
              <div>
                <dt>تاريخ الانتهاء</dt>
                <dd dir="ltr">{project.endDate || '—'}</dd>
              </div>
              <div>
                <dt>عدد القيود</dt>
                <dd>{summary.entryCount}</dd>
              </div>
            </dl>

            {project.notes && <p className="project-v2-notes">{project.notes}</p>}
          </article>

          <article className="project-v2-card project-v2-entries">
            <div className="project-v2-card__heading project-v2-card__heading--entries">
              <div>
                <span>الحركة المالية</span>
                <h2>القيود المرتبطة</h2>
              </div>
              <small>{summary.entryCount} قيد</small>
            </div>

            {entries.length === 0 ? (
              <div className="project-v2-empty">
                <BriefcaseBusiness size={26} />
                <p>لا توجد قيود مرتبطة بهذا المشروع.</p>
              </div>
            ) : (
              <div className="project-v2-table-scroll">
                <table className="project-v2-table">
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
                      <tr key={entry.id}>
                        <td className="project-v2-number">{entry.seq ? `#${entry.seq}` : '—'}</td>
                        <td dir="ltr">{entry.entryDate}</td>
                        <td>
                          <span className={`project-v2-badge project-v2-badge--${entry.type}`}>
                            {entry.type === 'income' ? 'إيراد' : 'مصروف'}
                          </span>
                        </td>
                        <td>{entry.category || '—'}</td>
                        <td className="project-v2-description">{entry.description || '—'}</td>
                        <td>{entry.contractor || '—'}</td>
                        <td className={`project-v2-amount project-v2-amount--${entry.type}`}>
                          <CurrencyValue value={entry.amount} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <aside className="project-v2-sidebar">
          <article className="project-v2-card project-v2-progress-card">
            <div className="project-v2-card__heading">
              <div>
                <span>حالة التنفيذ</span>
                <h2>نسبة الإنجاز</h2>
              </div>
            </div>
            <div className="project-v2-progress-ring" style={progressStyle}>
              <div>
                <strong>{progress}%</strong>
                <span>مكتمل</span>
              </div>
            </div>
            <p>تم إنجاز {progress}% من الأعمال المسجلة للمشروع.</p>
          </article>

          <article className="project-v2-card project-v2-summary-card">
            <div className="project-v2-card__heading">
              <div>
                <span>الموقف المالي</span>
                <h2>ملخص سريع</h2>
              </div>
            </div>
            <div className="project-v2-summary-row">
              <span>الإيرادات</span>
              <strong className="is-income">
                <CurrencyValue value={summary.totalIncome} />
              </strong>
            </div>
            <div className="project-v2-summary-row">
              <span>المصروفات</span>
              <strong className="is-expense">
                <CurrencyValue value={summary.totalExpense} />
              </strong>
            </div>
            <div className="project-v2-summary-row project-v2-summary-row--total">
              <span>الصافي</span>
              <strong>
                <CurrencyValue value={summary.balance} />
              </strong>
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}

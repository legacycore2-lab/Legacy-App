import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  FileBarChart,
  MapPin,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectDetails } from '../hooks/useProjectDetails'
import '../styles/project-details.css'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})

const date = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const statusLabel = {
  active: 'جاري التنفيذ',
  completed: 'مكتمل',
  paused: 'متوقف مؤقتًا',
  archived: 'مؤرشف',
}

const projectMilestones = [
  { label: 'بدء المشروع', point: 0 },
  { label: 'الهيكل الأساسي', point: 25 },
  { label: 'التشطيبات', point: 60 },
  { label: 'التسليم', point: 100 },
] as const

function formatDate(value: string) {
  if (!value) return 'غير محدد'

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : date.format(parsed)
}

function Currency({ value }: { value: number }) {
  return (
    <bdi dir="ltr" className="project-command__currency">
      {money.format(value)}
    </bdi>
  )
}

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { details, isLoading, error } = useProjectDetails(id ?? null)

  if (isLoading) {
    return <div className="project-command__state">جارٍ تحميل مركز المشروع...</div>
  }

  if (error) {
    return <div className="project-command__state project-command__state--error">{error}</div>
  }

  if (!details) {
    return <div className="project-command__state">المشروع غير موجود.</div>
  }

  const { project, summary, analytics } = details
  const progress = Math.min(100, Math.max(0, project.progress))
  const remaining = project.contractValue - summary.totalExpense

  return (
    <section className="project-command erp-viewport-page">
      <header className="project-command__header erp-page-static">
        <div className="project-command__title-area">
          <button
            type="button"
            className="project-command__back"
            onClick={() => navigate('/projects')}
            aria-label="العودة إلى المشاريع"
          >
            <ArrowRight size={17} />
          </button>

          <div className="project-command__identity-icon">
            <Building2 size={27} />
          </div>

          <div className="project-command__identity">
            <div className="project-command__headline">
              <h1>{project.name}</h1>
              <span className={`project-command__status project-command__status--${project.status}`}>
                {statusLabel[project.status]}
              </span>
            </div>

            <p>
              {project.code || 'بدون كود'} · {project.client || 'بدون عميل'}
            </p>

            <div className="project-command__meta">
              <span>
                <MapPin size={14} />
                {project.location || 'الموقع غير محدد'}
              </span>
              <span>
                <UserRound size={14} />
                {project.manager || 'المدير غير محدد'}
              </span>
              <span>
                <CalendarDays size={14} />
                {formatDate(project.startDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="project-command__actions">
          <button type="button" className="project-command__button project-command__button--secondary">
            <FileBarChart size={17} /> تقرير المشروع
          </button>
          <button
            type="button"
            className="project-command__button project-command__button--primary"
            onClick={() => navigate('/journal')}
          >
            <Plus size={17} /> إضافة قيد
          </button>
        </div>
      </header>

      <div className="project-command__scroll erp-scroll-region">
        <div className="project-command__kpis">
          <article>
            <CircleDollarSign />
            <span>قيمة العقد</span>
            <strong>
              <Currency value={project.contractValue} />
            </strong>
          </article>
          <article className="is-income">
            <TrendingUp />
            <span>الإيرادات</span>
            <strong>
              <Currency value={summary.totalIncome} />
            </strong>
          </article>
          <article className="is-expense">
            <TrendingDown />
            <span>المصروفات</span>
            <strong>
              <Currency value={summary.totalExpense} />
            </strong>
          </article>
          <article>
            <Wallet />
            <span>الصافي</span>
            <strong>
              <Currency value={summary.balance} />
            </strong>
          </article>
          <article className={remaining < 0 ? 'is-expense' : ''}>
            <ReceiptText />
            <span>المتبقي من العقد</span>
            <strong>
              <Currency value={remaining} />
            </strong>
          </article>
        </div>

        <div className="project-command__workspace">
          <main className="project-command__main-column">
            <article className="project-command__panel project-command__progress-panel">
              <div className="project-command__panel-heading">
                <div>
                  <span>التنفيذ</span>
                  <h2>تقدم المشروع</h2>
                </div>
                <strong>{progress}%</strong>
              </div>

              <div className="project-command__progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>

              <div className="project-command__milestones">
                {projectMilestones.map(({ label, point }) => (
                  <div key={label} className={progress >= point ? 'is-done' : ''}>
                    <span />
                    <strong>{label}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="project-command__panel">
              <div className="project-command__panel-heading">
                <div>
                  <span>الحركة المالية</span>
                  <h2>آخر القيود</h2>
                </div>
                <button type="button" onClick={() => navigate('/journal')}>
                  عرض الكل <ChevronLeft size={16} />
                </button>
              </div>

              {analytics.recentEntries.length === 0 ? (
                <div className="project-command__empty">لا توجد قيود مرتبطة بالمشروع حتى الآن.</div>
              ) : (
                <div className="project-command__table-wrap">
                  <table style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>رقم</th>
                        <th>التاريخ</th>
                        <th>النوع</th>
                        <th>البند</th>
                        <th>البيان</th>
                        <th>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>#{entry.seq ?? '—'}</td>
                          <td>{formatDate(entry.entryDate)}</td>
                          <td>
                            <span
                              className={`project-command__entry-type project-command__entry-type--${entry.type}`}
                            >
                              {entry.type === 'income' ? 'إيراد' : 'مصروف'}
                            </span>
                          </td>
                          <td>{entry.category || '—'}</td>
                          <td>{entry.description || '—'}</td>
                          <td className={entry.type === 'expense' ? 'is-expense-text' : 'is-income-text'}>
                            <Currency value={entry.amount} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </main>

          <aside className="project-command__side-column">
            <article className="project-command__panel">
              <div className="project-command__panel-heading">
                <div>
                  <span>التحليل</span>
                  <h2>توزيع المصروفات</h2>
                </div>
                <BarChart3 size={20} />
              </div>

              <div className="project-command__categories">
                {analytics.expenseCategories.length === 0 ? (
                  <div className="project-command__empty">لا توجد مصروفات بعد.</div>
                ) : (
                  analytics.expenseCategories.map(({ label, value, percentage }) => (
                    <div key={label}>
                      <div>
                        <span>{label}</span>
                        <strong>
                          <Currency value={value} />
                        </strong>
                      </div>
                      <div className="project-command__category-track">
                        <span style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="project-command__panel project-command__facts">
              <div className="project-command__panel-heading">
                <div>
                  <span>البيانات الأساسية</span>
                  <h2>ملف المشروع</h2>
                </div>
              </div>

              <dl>
                <div>
                  <dt>العميل</dt>
                  <dd>{project.client || '—'}</dd>
                </div>
                <div>
                  <dt>مدير المشروع</dt>
                  <dd>{project.manager || '—'}</dd>
                </div>
                <div>
                  <dt>تاريخ البداية</dt>
                  <dd>{formatDate(project.startDate)}</dd>
                </div>
                <div>
                  <dt>تاريخ النهاية</dt>
                  <dd>{formatDate(project.endDate)}</dd>
                </div>
                <div>
                  <dt>عدد القيود</dt>
                  <dd>{summary.entryCount}</dd>
                </div>
              </dl>

              {project.notes && <p>{project.notes}</p>}
            </article>
          </aside>
        </div>
      </div>
    </section>
  )
}

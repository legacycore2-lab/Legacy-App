import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  FileBarChart,
  FileText,
  FolderArchive,
  HandCoins,
  Landmark,
  MapPin,
  MoreVertical,
  Paperclip,
  ReceiptText,
  Settings,
  Star,
  TrendingDown,
  TrendingUp,
  Truck,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectDetails } from '../hooks/useProjectDetails'
import '../styles/project-details.css'
import '../styles/project-workspace.css'

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
  active: 'نشط',
  completed: 'مكتمل',
  paused: 'متوقف مؤقتًا',
  archived: 'مؤرشف',
}

const workspaceTabs = [
  { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
  { id: 'finance', label: 'المالية', icon: CircleDollarSign },
  { id: 'journal', label: 'القيود اليومية', icon: ClipboardList },
  { id: 'banks', label: 'الخزنة والبنوك', icon: Landmark },
  { id: 'advances', label: 'العهد والسلف', icon: HandCoins },
  { id: 'contractors', label: 'المقاولون', icon: UsersRound },
  { id: 'suppliers', label: 'الموردون', icon: Truck },
  { id: 'attachments', label: 'المرفقات', icon: Paperclip },
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
  const [actionsOpen, setActionsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof workspaceTabs)[number]['id']>('overview')

  if (isLoading) return <div className="project-command__state">جارٍ تحميل مساحة المشروع...</div>
  if (error) return <div className="project-command__state project-command__state--error">{error}</div>
  if (!details) return <div className="project-command__state">المشروع غير موجود.</div>

  const { project, summary, analytics } = details
  const remaining = project.contractValue - summary.totalExpense
  const donutSegments = analytics.expenseCategories.slice(0, 5)
  const donutGradient = donutSegments.length
    ? `conic-gradient(${donutSegments
        .map((item, index) => {
          const before = donutSegments.slice(0, index).reduce((sum, current) => sum + current.percentage, 0)
          return `var(--workspace-chart-${index + 1}) ${before}% ${before + item.percentage}%`
        })
        .join(', ')})`
    : 'var(--surface-soft)'

  const actionItems = [
    { label: 'تعديل المشروع', icon: Settings },
    { label: 'القيود اليومية', icon: ClipboardList, action: () => navigate('/journal') },
    { label: 'المالية', icon: CircleDollarSign },
    { label: 'الخزنة والبنوك', icon: Landmark },
    { label: 'العهد والسلف', icon: HandCoins },
    { label: 'المقاولون', icon: UsersRound },
    { label: 'الموردون', icon: Truck },
    { label: 'المرفقات', icon: Paperclip },
    { label: 'تقارير المشروع', icon: FileBarChart },
    { label: 'إعدادات المشروع', icon: Settings },
  ]

  return (
    <section className="project-command project-workspace erp-viewport-page">
      <header className="project-workspace__hero erp-page-static">
        <div className="project-workspace__topline">
          <button type="button" className="project-command__back" onClick={() => navigate('/projects')}>
            <ArrowRight size={17} />
          </button>
          <span>المشاريع</span>
          <ChevronLeft size={15} />
          <strong>{project.name}</strong>
        </div>

        <div className="project-workspace__identity-row">
          <div className="project-workspace__identity">
            <div className="project-workspace__title">
              <h1>{project.name}</h1>
              <button type="button" className="project-workspace__favorite" aria-label="إضافة للمفضلة">
                <Star size={20} />
              </button>
            </div>
            <div className="project-workspace__meta">
              <span>{project.code || 'بدون كود'}</span>
              <span>{project.client || 'بدون عميل'}</span>
              <span>
                <MapPin size={14} /> {project.location || 'الموقع غير محدد'}
              </span>
              <span>
                <CalendarDays size={14} /> {formatDate(project.startDate)}
              </span>
              <span>إلى {formatDate(project.endDate)}</span>
            </div>
          </div>

          <div className="project-workspace__hero-actions">
            <span className={`project-command__status project-command__status--${project.status}`}>
              {statusLabel[project.status]}
            </span>
            <div className="project-workspace__actions-menu">
              <button
                type="button"
                className="project-workspace__actions-button"
                onClick={() => setActionsOpen((current) => !current)}
                aria-expanded={actionsOpen}
              >
                إجراءات <MoreVertical size={18} />
              </button>
              {actionsOpen && (
                <div className="project-workspace__dropdown">
                  <button
                    type="button"
                    className="project-workspace__dropdown-close"
                    onClick={() => setActionsOpen(false)}
                  >
                    <X size={16} />
                  </button>
                  {actionItems.map(({ label, icon: Icon, action }) => (
                    <button key={label} type="button" onClick={action}>
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                  <div className="project-workspace__dropdown-separator" />
                  <button type="button" className="is-warning">
                    <FolderArchive size={16} /> أرشفة المشروع
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="project-workspace__tabs" aria-label="أقسام المشروع">
          {workspaceTabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              className={activeTab === tabId ? 'is-active' : ''}
              onClick={() => setActiveTab(tabId)}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="project-command__scroll erp-scroll-region">
        <div className="project-workspace__kpis">
          <article className="is-income">
            <TrendingUp />
            <span>إجمالي الإيرادات</span>
            <strong>
              <Currency value={summary.totalIncome} />
            </strong>
          </article>
          <article className="is-expense">
            <TrendingDown />
            <span>إجمالي المصروفات</span>
            <strong>
              <Currency value={summary.totalExpense} />
            </strong>
          </article>
          <article>
            <Wallet />
            <span>صافي الربح</span>
            <strong>
              <Currency value={summary.balance} />
            </strong>
          </article>
          <article className="is-bank">
            <Landmark />
            <span>الرصيد الحالي</span>
            <strong>
              <Currency value={remaining} />
            </strong>
          </article>
          <article className="is-count">
            <ReceiptText />
            <span>عدد القيود</span>
            <strong>{summary.entryCount}</strong>
          </article>
        </div>

        <div className="project-workspace__dashboard-grid">
          <article className="project-command__panel project-workspace__cashflow">
            <div className="project-command__panel-heading">
              <div>
                <span>الحركة المالية</span>
                <h2>الإيرادات والمصروفات</h2>
              </div>
              <strong>{new Date().getFullYear()}</strong>
            </div>
            <div className="project-workspace__chart-legend">
              <span className="is-income">إيرادات</span>
              <span className="is-expense">مصروفات</span>
              <span className="is-balance">صافي التدفق</span>
            </div>
            <div className="project-workspace__bars" aria-label="ملخص بصري للتدفق المالي">
              {[42, 48, 66, 54, 61, 57, 69].map((height, index) => (
                <div key={`bar-${index}`}>
                  <i style={{ height: `${height}%` }} />
                  <b style={{ height: `${Math.max(18, height - 24)}%` }} />
                  <span>{index + 1}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="project-command__panel project-workspace__distribution">
            <div className="project-command__panel-heading">
              <div>
                <span>التحليل</span>
                <h2>توزيع المصروفات</h2>
              </div>
              <BarChart3 size={20} />
            </div>
            <div className="project-workspace__donut" style={{ background: donutGradient }}>
              <span>
                <Currency value={summary.totalExpense} />
              </span>
            </div>
            <div className="project-workspace__legend-list">
              {donutSegments.length === 0 ? (
                <p>لا توجد مصروفات بعد.</p>
              ) : (
                donutSegments.map((item, index) => (
                  <div key={item.label}>
                    <i style={{ background: `var(--workspace-chart-${index + 1})` }} />
                    <span>{item.label}</span>
                    <strong>{item.percentage}%</strong>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="project-command__panel project-workspace__facts">
            <div className="project-command__panel-heading">
              <div>
                <span>البيانات الأساسية</span>
                <h2>معلومات المشروع</h2>
              </div>
              <Building2 size={20} />
            </div>
            <dl>
              <div>
                <dt>اسم المشروع</dt>
                <dd>{project.name}</dd>
              </div>
              <div>
                <dt>كود المشروع</dt>
                <dd>{project.code || '—'}</dd>
              </div>
              <div>
                <dt>العميل</dt>
                <dd>{project.client || '—'}</dd>
              </div>
              <div>
                <dt>الموقع</dt>
                <dd>{project.location || '—'}</dd>
              </div>
              <div>
                <dt>مدير المشروع</dt>
                <dd>{project.manager || '—'}</dd>
              </div>
              <div>
                <dt>قيمة العقد</dt>
                <dd>
                  <Currency value={project.contractValue} />
                </dd>
              </div>
            </dl>
          </article>

          <article className="project-command__panel project-workspace__entries">
            <div className="project-command__panel-heading">
              <div>
                <span>الحركة المالية</span>
                <h2>آخر القيود اليومية</h2>
              </div>
              <button type="button" onClick={() => navigate('/journal')}>
                عرض جميع القيود <ChevronLeft size={16} />
              </button>
            </div>
            {analytics.recentEntries.length === 0 ? (
              <div className="project-command__empty">لا توجد قيود مرتبطة بالمشروع.</div>
            ) : (
              <div className="project-command__table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">رقم القيد</th>
                      <th scope="col">التاريخ</th>
                      <th scope="col">البيان</th>
                      <th scope="col">النوع</th>
                      <th scope="col">المبلغ</th>
                      <th scope="col">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>#{entry.seq ?? '—'}</td>
                        <td>{formatDate(entry.entryDate)}</td>
                        <td>{entry.description || '—'}</td>
                        <td>
                          <span
                            className={`project-command__entry-type project-command__entry-type--${entry.type}`}
                          >
                            {entry.type === 'income' ? 'إيراد' : 'مصروف'}
                          </span>
                        </td>
                        <td>
                          <Currency value={entry.amount} />
                        </td>
                        <td>{entry.paymentMethod || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="project-command__panel project-workspace__attachments">
            <div className="project-command__panel-heading">
              <div>
                <span>الملفات</span>
                <h2>أحدث المرفقات</h2>
              </div>
              <Paperclip size={20} />
            </div>
            <div className="project-workspace__empty-files">
              <FileText size={34} />
              <strong>المرفقات ستظهر هنا</strong>
              <span>سيتم ربطها بوحدة المستندات في المرحلة التالية.</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

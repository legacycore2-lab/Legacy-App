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
  Files,
  FolderArchive,
  Gauge,
  HandCoins,
  Landmark,
  MapPin,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  ReceiptText,
  Settings,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProjectCreateDialog } from '../components/ProjectCreateDialog'
import { ProjectDeleteDialog } from '../components/ProjectDeleteDialog'
import { useProjectCreateForm } from '../hooks/useProjectCreateForm'
import { useProjectDelete } from '../hooks/useProjectDelete'
import { useProjectDetails } from '../hooks/useProjectDetails'
import '../styles/project-create.css'
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
  active: 'جاري التنفيذ',
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
  { id: 'reports', label: 'التقارير', icon: FileBarChart },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
] as const

type WorkspaceTabId = (typeof workspaceTabs)[number]['id']

const internalSectionCopy: Partial<Record<WorkspaceTabId, { title: string; description: string }>> = {
  contractors: {
    title: 'مقاولو المشروع',
    description: 'سيتم عرض وربط مقاولي المشروع هنا عند اكتمال وحدة المقاولين.',
  },
  suppliers: {
    title: 'موردو المشروع',
    description: 'سيتم عرض وربط موردي المشروع هنا عند اكتمال وحدة الموردين.',
  },
  attachments: {
    title: 'مرفقات المشروع',
    description: 'رفع الملفات وربطها بالمشروع يحتاج وحدة مستندات مستقلة وصلاحيات Storage.',
  },
}

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
  const { viewModel, isLoading, error } = useProjectDetails(id ?? null)
  const projectCreate = useProjectCreateForm()
  const projectDelete = useProjectDelete(viewModel?.project.id ?? null, viewModel?.project.name ?? '')
  const [actionsOpen, setActionsOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview')

  if (isLoading) {
    return <div className="project-command__state">جارٍ تحميل مساحة المشروع...</div>
  }
  if (error) {
    return <div className="project-command__state project-command__state--error">{error}</div>
  }
  if (!viewModel) return <div className="project-command__state">المشروع غير موجود.</div>

  const { project, summary, analytics, progress, remaining, profitMargin, donutSegments, donutGradient } =
    viewModel
  const projectQuery = `projectId=${encodeURIComponent(project.id)}`

  const selectTab = (tabId: WorkspaceTabId) => {
    const routeByTab: Partial<Record<WorkspaceTabId, string>> = {
      journal: `/journal?${projectQuery}`,
      banks: `/banks?${projectQuery}`,
      advances: `/advances?${projectQuery}`,
      reports: `/reports?${projectQuery}`,
      settings: `/settings?${projectQuery}`,
    }
    const route = routeByTab[tabId]
    if (route) {
      navigate(route)
      return
    }
    setActiveTab(tabId)
  }

  const actionItems = [
    { label: 'تعديل المشروع', icon: Pencil, action: () => projectCreate.edit(project) },
    { label: 'القيود اليومية', icon: ClipboardList, action: () => selectTab('journal') },
    { label: 'المالية', icon: CircleDollarSign, action: () => selectTab('finance') },
    { label: 'الخزنة والبنوك', icon: Landmark, action: () => selectTab('banks') },
    { label: 'العهد والسلف', icon: HandCoins, action: () => selectTab('advances') },
    { label: 'المقاولون', icon: UsersRound, action: () => selectTab('contractors') },
    { label: 'الموردون', icon: Truck, action: () => selectTab('suppliers') },
    { label: 'المرفقات', icon: Paperclip, action: () => selectTab('attachments') },
    { label: 'تقارير المشروع', icon: FileBarChart, action: () => selectTab('reports') },
    { label: 'إعدادات المشروع', icon: Settings, action: () => selectTab('settings') },
  ]

  const internalSection = internalSectionCopy[activeTab]

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
          <div className="project-workspace__identity-wrap">
            <div className="project-workspace__project-mark">
              <Building2 size={28} />
            </div>
            <div className="project-workspace__identity">
              <div className="project-workspace__title">
                <h1>{project.name}</h1>
                <span className={`project-command__status project-command__status--${project.status}`}>
                  {statusLabel[project.status]}
                </span>
                <button
                  type="button"
                  className={`project-workspace__favorite ${isFavorite ? 'is-active' : ''}`}
                  aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  aria-pressed={isFavorite}
                  onClick={() => setIsFavorite((current) => !current)}
                >
                  <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="project-workspace__meta">
                <span className="is-code">{project.code || 'بدون كود'}</span>
                <span>{project.client || 'بدون عميل'}</span>
                <span>
                  <MapPin size={14} /> {project.location || 'الموقع غير محدد'}
                </span>
                <span>
                  <UsersRound size={14} /> {project.manager || 'المدير غير محدد'}
                </span>
                <span>
                  <CalendarDays size={14} /> {formatDate(project.startDate)} — {formatDate(project.endDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="project-workspace__hero-actions">
            <button
              type="button"
              className="project-workspace__quick-button is-secondary"
              onClick={() => projectCreate.edit(project)}
            >
              <Pencil size={16} /> تعديل
            </button>
            <button
              type="button"
              className="project-workspace__quick-button is-primary"
              onClick={() => navigate(`/journal?${projectQuery}`)}
            >
              <Plus size={17} /> إضافة قيد
            </button>
            <button
              type="button"
              className="project-workspace__quick-button is-secondary"
              onClick={() => selectTab('attachments')}
            >
              <Upload size={16} /> رفع ملف
            </button>
            <button
              type="button"
              className="project-workspace__quick-button is-secondary"
              onClick={() => selectTab('reports')}
            >
              <FileBarChart size={16} /> تقرير
            </button>
            <div className="project-workspace__actions-menu">
              <button
                type="button"
                className="project-workspace__actions-button"
                onClick={() => setActionsOpen((current) => !current)}
                aria-expanded={actionsOpen}
                aria-haspopup="menu"
                aria-label="المزيد من إجراءات المشروع"
              >
                <MoreVertical size={19} />
              </button>
              {actionsOpen && (
                <div className="project-workspace__dropdown">
                  <button
                    type="button"
                    className="project-workspace__dropdown-close"
                    onClick={() => setActionsOpen(false)}
                    aria-label="إغلاق القائمة"
                  >
                    <X size={16} />
                  </button>
                  {actionItems.map(({ label, icon: Icon, action }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        action()
                        setActionsOpen(false)
                      }}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                  <div className="project-workspace__dropdown-separator" />
                  <button
                    type="button"
                    className="is-warning"
                    disabled
                    title="الأرشفة تحتاج دورة تشغيل مستقلة"
                  >
                    <FolderArchive size={16} /> أرشفة المشروع
                  </button>
                  <button
                    type="button"
                    className="is-warning"
                    onClick={() => {
                      projectDelete.open()
                      setActionsOpen(false)
                    }}
                  >
                    <Trash2 size={16} /> حذف المشروع
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="project-workspace__hero-progress">
          <div>
            <span>نسبة إنجاز المشروع</span>
            <strong>{progress}%</strong>
          </div>
          <div className="project-workspace__hero-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <nav role="tablist" className="project-workspace__tabs" aria-label="أقسام المشروع">
          {workspaceTabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={activeTab === tabId}
              className={activeTab === tabId ? 'is-active' : ''}
              onClick={() => selectTab(tabId)}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="project-command__scroll erp-scroll-region">
        {internalSection ? (
          <article className="project-command__panel project-workspace__facts">
            <div className="project-command__panel-heading">
              <div>
                <span>مساحة المشروع</span>
                <h2>{internalSection.title}</h2>
              </div>
            </div>
            <div className="project-command__empty">{internalSection.description}</div>
          </article>
        ) : (
          <>
            <div className="project-workspace__kpis">
              <article className="is-contract">
                <CircleDollarSign />
                <span>قيمة العقد</span>
                <strong>
                  <Currency value={project.contractValue} />
                </strong>
                <small>القيمة الإجمالية</small>
              </article>
              <article className="is-income">
                <TrendingUp />
                <span>إجمالي الإيرادات</span>
                <strong>
                  <Currency value={summary.totalIncome} />
                </strong>
                <small>المقبوضات المسجلة</small>
              </article>
              <article className="is-expense">
                <TrendingDown />
                <span>إجمالي المصروفات</span>
                <strong>
                  <Currency value={summary.totalExpense} />
                </strong>
                <small>تكلفة المشروع</small>
              </article>
              <article className="is-profit">
                <Wallet />
                <span>صافي الربح</span>
                <strong>
                  <Currency value={summary.balance} />
                </strong>
                <small>{profitMargin}% هامش الربح</small>
              </article>
              <article className="is-bank">
                <Landmark />
                <span>المتبقي من العقد</span>
                <strong>
                  <Currency value={remaining} />
                </strong>
                <small>بعد المصروفات</small>
              </article>
              <article className="is-count">
                <ReceiptText />
                <span>عدد القيود</span>
                <strong>{summary.entryCount}</strong>
                <small>قيد مالي</small>
              </article>
              <article className="is-files">
                <Files />
                <span>المرفقات</span>
                <strong>0</strong>
                <small>ملف محفوظ</small>
              </article>
              <article className="is-progress">
                <Gauge />
                <span>نسبة الإنجاز</span>
                <strong>{progress}%</strong>
                <small>التقدم الحالي</small>
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
                    donutSegments.map((seg) => (
                      <div key={seg.label}>
                        <i style={{ background: seg.cssVar }} />
                        <span>{seg.label}</span>
                        <strong>{seg.percentage}%</strong>
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
                  <button type="button" onClick={() => navigate(`/journal?${projectQuery}`)}>
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
          </>
        )}
      </div>

      <ProjectCreateDialog {...projectCreate} />
      <ProjectDeleteDialog
        open={projectDelete.isOpen}
        projectName={project.name}
        confirmation={projectDelete.confirmation}
        onConfirmationChange={projectDelete.setConfirmation}
        canDelete={projectDelete.canDelete}
        isDeleting={projectDelete.isDeleting}
        error={projectDelete.error}
        onClose={projectDelete.close}
        onConfirm={() => {
          void projectDelete.submit().then((deleted) => {
            if (deleted) navigate('/projects')
          })
        }}
      />
    </section>
  )
}

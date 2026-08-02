import { BarChart3, Building2, ChevronLeft, FileText, Paperclip } from 'lucide-react'
import type { MonthlyCashflowBar, ProjectDetailsViewModel } from '../types/project.types'

type Props = {
  viewModel: ProjectDetailsViewModel
  monthlyCashflow: MonthlyCashflowBar[]
  projectQuery: string
  onNavigate: (path: string) => void
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function Currency({ value }: { value: number }) {
  return (
    <bdi dir="ltr" className="project-command__currency">
      {money.format(value)}
    </bdi>
  )
}

function formatDate(value: string) {
  if (!value) return 'غير محدد'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed)
}

export function WorkspaceOverviewTab({ viewModel, monthlyCashflow, projectQuery, onNavigate }: Props) {
  const { project, summary, analytics, donutSegments, donutGradient } = viewModel

  return (
    <div className="project-workspace__dashboard-grid">
      {/* ── Cashflow chart ── */}
      <article className="project-command__panel project-workspace__cashflow">
        <div className="project-command__panel-heading">
          <div>
            <span>الحركة المالية</span>
            <h2>الإيرادات والمصروفات — آخر 7 أشهر</h2>
          </div>
          <strong>{new Date().getFullYear()}</strong>
        </div>
        <div className="project-workspace__chart-legend">
          <span className="is-income">إيرادات</span>
          <span className="is-expense">مصروفات</span>
        </div>
        {monthlyCashflow.every((b) => b.incomeAmount === 0 && b.expenseAmount === 0) ? (
          <div className="project-command__empty">لا توجد حركة مالية في الأشهر السبعة الماضية.</div>
        ) : (
          <div className="project-workspace__bars" aria-label="التدفق المالي الشهري">
            {monthlyCashflow.map((bar) => (
              <div
                key={bar.label}
                title={`${bar.label}: إيرادات ${money.format(bar.incomeAmount)} — مصروفات ${money.format(bar.expenseAmount)}`}
              >
                <i style={{ height: `${Math.max(4, bar.incomeHeight)}%` }} aria-hidden="true" />
                <b style={{ height: `${Math.max(4, bar.expenseHeight)}%` }} aria-hidden="true" />
                <span>{bar.label.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* ── Donut distribution ── */}
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

      {/* ── Project facts ── */}
      <article className="project-command__panel project-workspace__facts">
        <div className="project-command__panel-heading">
          <div>
            <span>البيانات الأساسية</span>
            <h2>معلومات المشروع</h2>
          </div>
          <Building2 size={20} />
        </div>
        <dl>
          {[
            { label: 'اسم المشروع', value: project.name },
            { label: 'كود المشروع', value: project.code || '—' },
            { label: 'العميل', value: project.client || '—' },
            { label: 'الموقع', value: project.location || '—' },
            { label: 'مدير المشروع', value: project.manager || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div>
            <dt>قيمة العقد</dt>
            <dd>
              <Currency value={project.contractValue} />
            </dd>
          </div>
          <div>
            <dt>تاريخ البداية</dt>
            <dd>{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt>تاريخ الانتهاء</dt>
            <dd>{formatDate(project.endDate)}</dd>
          </div>
        </dl>
      </article>

      {/* ── Recent entries ── */}
      <article className="project-command__panel project-workspace__entries">
        <div className="project-command__panel-heading">
          <div>
            <span>الحركة المالية</span>
            <h2>آخر القيود اليومية</h2>
          </div>
          <button type="button" onClick={() => onNavigate(`/journal?${projectQuery}`)}>
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

      {/* ── Attachments placeholder ── */}
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
  )
}

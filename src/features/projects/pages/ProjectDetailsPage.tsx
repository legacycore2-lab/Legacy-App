import {
  ArrowRight,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
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
import type { ProjectEntry } from '../types/project.types'
import '../styles/project-details.css'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})

const statusLabel: Record<string, string> = {
  active: 'جاري',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
}

function CurrencyValue({ value }: { value: number }) {
  return <bdi dir="ltr">{money.format(value)}</bdi>
}

function groupExpenses(entries: ProjectEntry[]) {
  const totals = new Map<string, number>()
  entries
    .filter((entry) => entry.type === 'expense')
    .forEach((entry) => totals.set(entry.category || 'أخرى', (totals.get(entry.category || 'أخرى') ?? 0) + entry.amount))
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
}

function groupMonthly(entries: ProjectEntry[]) {
  const months = new Map<string, { income: number; expense: number }>()
  entries.forEach((entry) => {
    const month = entry.entryDate.slice(0, 7)
    const current = months.get(month) ?? { income: 0, expense: 0 }
    current[entry.type] += entry.amount
    months.set(month, current)
  })
  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, values]) => ({ month, ...values }))
}

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { details, isLoading, error } = useProjectDetails(id ?? null)

  if (isLoading) return <div className="project-command-state">جارٍ تحميل تفاصيل المشروع...</div>
  if (error) return <div className="project-command-state project-command-state--error">{error}</div>
  if (!details) return <div className="project-command-state">المشروع غير موجود.</div>

  const { project, entries, summary } = details
  const progress = Math.min(100, Math.max(0, project.progress))
  const remaining = project.contractValue - summary.totalExpense
  const expenseGroups = groupExpenses(entries)
  const monthly = groupMonthly(entries)
  const maxMonthly = Math.max(1, ...monthly.flatMap((item) => [item.income, item.expense]))
  const maxExpense = Math.max(1, ...expenseGroups.map((item) => item.value))
  const recentEntries = entries.slice(0, 5)

  return (
    <section className="project-command-page">
      <header className="project-command-header">
        <div className="project-command-header__top">
          <button type="button" className="project-command-back" onClick={() => navigate('/projects')}>
            <ArrowRight size={16} /> العودة إلى المشاريع
          </button>
          <div className="project-command-actions">
            <button type="button" className="project-command-button project-command-button--ghost">
              <FileBarChart size={17} /> تقرير المشروع
            </button>
            <button type="button" className="project-command-button project-command-button--primary" onClick={() => navigate('/journal')}>
              <Plus size={18} /> إضافة قيد
            </button>
          </div>
        </div>

        <div className="project-command-identity">
          <span className="project-command-identity__icon"><Building2 size={28} /></span>
          <div className="project-command-identity__content">
            <div className="project-command-title-row">
              <h1>{project.name}</h1>
              <span className={`project-command-status project-command-status--${project.status}`}>
                {statusLabel[project.status] ?? project.status}
              </span>
            </div>
            <p>{project.code || 'بدون كود'} · {project.client || 'بدون عميل'}</p>
            <div className="project-command-meta">
              <span><MapPin size={15} />{project.location || 'الموقع غير محدد'}</span>
              <span><UserRound size={15} />{project.manager || 'المدير غير محدد'}</span>
              <span><CalendarDays size={15} /><bdi dir="ltr">{project.startDate || '—'}</bdi></span>
              <span><Clock3 size={15} /><bdi dir="ltr">{project.endDate || 'بدون تاريخ انتهاء'}</bdi></span>
            </div>
          </div>
        </div>
      </header>

      <div className="project-command-kpis">
        {[
          { label: 'قيمة العقد', value: project.contractValue, icon: CircleDollarSign, tone: 'gold' },
          { label: 'الإيرادات', value: summary.totalIncome, icon: TrendingUp, tone: 'green' },
          { label: 'المصروفات', value: summary.totalExpense, icon: TrendingDown, tone: 'red' },
          { label: 'الصافي', value: summary.balance, icon: Wallet, tone: summary.balance >= 0 ? 'blue' : 'red' },
          { label: 'المتبقي من العقد', value: remaining, icon: FileText, tone: 'green' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className={`project-command-kpi project-command-kpi--${tone}`}>
            <div className="project-command-kpi__head"><span>{label}</span><i><Icon size={19} /></i></div>
            <strong><CurrencyValue value={value} /></strong>
            <div className="project-command-kpi__track"><span /></div>
          </article>
        ))}
      </div>

      <div className="project-command-analytics">
        <article className="project-command-panel project-command-progress">
          <div className="project-command-panel__heading"><div><span>حالة التنفيذ</span><h2>نسبة الإنجاز</h2></div><strong>{progress}%</strong></div>
          <div className="project-command-progress__bar"><span style={{ width: `${progress}%` }} /></div>
          <div className="project-command-stages">
            {['التخطيط', 'التنفيذ', 'المتابعة', 'الإغلاق'].map((stage, index) => {
              const activeIndex = Math.min(3, Math.floor(progress / 25))
              return <div key={stage} className={index <= activeIndex ? 'is-active' : ''}><i>{index + 1}</i><span>{stage}</span></div>
            })}
          </div>
        </article>

        <article className="project-command-panel">
          <div className="project-command-panel__heading"><div><span>آخر 6 أشهر</span><h2>التدفق النقدي</h2></div></div>
          {monthly.length ? <div className="project-command-bars">
            {monthly.map((item) => <div key={item.month} className="project-command-bars__group">
              <div><span className="is-income" style={{ height: `${Math.max(5, item.income / maxMonthly * 100)}%` }} /><span className="is-expense" style={{ height: `${Math.max(5, item.expense / maxMonthly * 100)}%` }} /></div>
              <small>{item.month.slice(5)}</small>
            </div>)}
          </div> : <div className="project-command-empty">لا توجد بيانات كافية للرسم.</div>}
        </article>

        <article className="project-command-panel">
          <div className="project-command-panel__heading"><div><span>حسب البند</span><h2>توزيع المصروفات</h2></div></div>
          {expenseGroups.length ? <div className="project-command-distribution">
            {expenseGroups.map((item) => <div key={item.label}>
              <div><span>{item.label}</span><strong><CurrencyValue value={item.value} /></strong></div>
              <div className="project-command-distribution__track"><span style={{ width: `${item.value / maxExpense * 100}%` }} /></div>
            </div>)}
          </div> : <div className="project-command-empty">لا توجد مصروفات مسجلة.</div>}
        </article>
      </div>

      <div className="project-command-bottom">
        <article className="project-command-panel project-command-entries">
          <div className="project-command-panel__heading"><div><span>الحركة المالية</span><h2>آخر القيود</h2></div><button type="button" onClick={() => navigate('/journal')}>عرض الكل</button></div>
          {recentEntries.length ? <div className="project-command-table-wrap"><table><thead><tr><th>رقم القيد</th><th>التاريخ</th><th>النوع</th><th>البند</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>
            {recentEntries.map((entry) => <tr key={entry.id}><td>{entry.seq ? `#${entry.seq}` : '—'}</td><td dir="ltr">{entry.entryDate}</td><td><span className={`project-command-badge project-command-badge--${entry.type}`}>{entry.type === 'income' ? 'إيراد' : 'مصروف'}</span></td><td>{entry.category || '—'}</td><td>{entry.description || '—'}</td><td className={entry.type === 'income' ? 'is-income-text' : 'is-expense-text'}><CurrencyValue value={entry.amount} /></td></tr>)}
          </tbody></table></div> : <div className="project-command-empty">لا توجد قيود مرتبطة بالمشروع.</div>}
        </article>

        <article className="project-command-panel project-command-activity">
          <div className="project-command-panel__heading"><div><span>سجل المشروع</span><h2>آخر النشاط</h2></div></div>
          <div className="project-command-timeline">
            {recentEntries.length ? recentEntries.slice(0, 4).map((entry) => <div key={entry.id}><i><FileText size={15} /></i><div><strong>تمت إضافة قيد {entry.seq ? `#${entry.seq}` : ''}</strong><span>{entry.description || entry.category || 'حركة مالية جديدة'}</span></div><time dir="ltr">{entry.entryDate}</time></div>) : <div className="project-command-empty">لا يوجد نشاط حتى الآن.</div>}
          </div>
        </article>
      </div>
    </section>
  )
}

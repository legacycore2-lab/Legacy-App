import { ArrowDownCircle, ArrowRight, ArrowUpCircle, FileText, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectDetails } from '../hooks/useProjectDetails'
import type { ProjectEntryFilters } from '../types/project-details.types'
import '../styles/project-details.css'

const currency = new Intl.NumberFormat('ar-EG')
const statusLabel = { active: 'مفتوح', completed: 'مكتمل', archived: 'مؤرشف' }

export function ProjectDetailsPage() {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const model = useProjectDetails(projectId)

  if (model.isProjectLoading) {
    return <div className="project-details-state">جاري تحميل بيانات المشروع...</div>
  }
  if (model.projectError) {
    return <div className="project-details-state project-details-error">{model.projectError}</div>
  }
  if (!model.project) {
    return <div className="project-details-state">المشروع غير موجود أو لا تملك صلاحية عرضه.</div>
  }

  return (
    <div className="project-details-page">
      <header className="project-details-header">
        <div>
          <span>تفاصيل المشروع</span>
          <h1>{model.project.name}</h1>
          <p>
            الحالة: {statusLabel[model.project.status]} · البداية: {model.project.startDate} · الإغلاق:{' '}
            {model.project.endDate}
          </p>
        </div>
        <button type="button" onClick={() => navigate('/projects')}>
          <ArrowRight size={18} /> العودة للمشاريع
        </button>
      </header>

      <section className="project-details-stats">
        <article><FileText /><span>إجمالي القيود</span><strong>{currency.format(model.summary.totalCount)}</strong></article>
        <article><ArrowUpCircle /><span>إيرادات الصفحة</span><strong>{currency.format(model.summary.pageIncome)} ج.م</strong></article>
        <article><ArrowDownCircle /><span>مصروفات الصفحة</span><strong>{currency.format(model.summary.pageExpense)} ج.م</strong></article>
        <article><FileText /><span>صافي الصفحة</span><strong>{currency.format(model.summary.pageNet)} ج.م</strong></article>
      </section>

      <section className="project-details-panel">
        <div className="project-details-toolbar">
          <label>
            <Search size={17} />
            <input
              value={model.filters.query}
              onChange={(event) => model.onFiltersChange({ ...model.filters, query: event.target.value })}
              placeholder="ابحث بالكود أو البند أو البيان أو المقاول..."
            />
          </label>
          <select
            value={model.filters.type}
            onChange={(event) =>
              model.onFiltersChange({
                ...model.filters,
                type: event.target.value as ProjectEntryFilters['type'],
              })
            }
          >
            <option value="all">كل الحركات</option>
            <option value="income">إيرادات</option>
            <option value="expense">مصروفات</option>
          </select>
        </div>

        <div className="project-details-table-wrap">
          {model.isLoading && <div className="project-details-state">جاري تحميل القيود...</div>}
          {model.error && <div className="project-details-state project-details-error">{model.error}</div>}
          {!model.isLoading && !model.error && model.entries.length === 0 && (
            <div className="project-details-state">لا توجد قيود لعرضها.</div>
          )}
          {!model.isLoading && !model.error && model.entries.length > 0 && (
            <table>
              <thead><tr><th>رقم القيد</th><th>التاريخ</th><th>النوع</th><th>البند</th><th>البيان</th><th>المقاول</th><th>طريقة الدفع</th><th>المبلغ</th></tr></thead>
              <tbody>
                {model.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>#{entry.sequence}</td><td>{entry.entryDate}</td>
                    <td>{entry.type === 'income' ? 'إيراد' : 'مصروف'}</td>
                    <td>{entry.category}</td><td>{entry.description}</td>
                    <td>{entry.contractor || '—'}</td><td>{entry.paymentMethod || '—'}</td>
                    <td>{currency.format(entry.amount)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!model.isLoading && !model.error && model.summary.totalCount > 0 && (
          <nav className="project-details-pagination" aria-label="صفحات قيود المشروع">
            <button type="button" onClick={model.onPreviousPage} disabled={model.page <= 1 || model.isRefreshing}>السابق</button>
            <span>صفحة {currency.format(model.page)} من {currency.format(model.totalPages)}{model.isRefreshing ? ' · جاري التحديث' : ''}</span>
            <button type="button" onClick={model.onNextPage} disabled={model.page >= model.totalPages || model.isRefreshing}>التالي</button>
          </nav>
        )}
      </section>
    </div>
  )
}

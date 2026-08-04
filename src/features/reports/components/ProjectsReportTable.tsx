import { Search } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ReportProjectRow } from '../types/report.types'

const STATUS_LABEL: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
  unknown: 'غير معروف',
}

type Props = {
  rows: ReportProjectRow[]
  query: string
  onQueryChange: (v: string) => void
  includeArchived: boolean
  onIncludeArchivedChange: (v: boolean) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  isLoading: boolean
}

// prettier-ignore
export function ProjectsReportTable({
  rows,
  query,
  onQueryChange,
  includeArchived,
  onIncludeArchivedChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
}: Props) {
  return (
    <section className="reports-panel">
      <div className="reports-panel__heading">
        <div>
          <span className="reports-label">ملخص المشاريع</span>
          <h2>الأداء المالي للمشاريع</h2>
        </div>
      </div>

      <div className="reports-table-filters">
        <label className="reports-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="بحث باسم المشروع أو الكود أو العميل..."
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="reports-select"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="completed">مكتمل</option>
          <option value="paused">متوقف</option>
          <option value="archived">مؤرشف</option>
        </select>
        <label className="reports-checkbox-label">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => onIncludeArchivedChange(e.target.checked)}
          />
          إظهار المؤرشفة
        </label>
      </div>

      {isLoading ? (
        <div className="reports-state">جارٍ تحميل بيانات المشاريع...</div>
      ) : rows.length === 0 ? (
        <div className="reports-state">لا توجد مشاريع مطابقة للفلاتر الحالية.</div>
      ) : (
        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>المشروع</th>
                <th>العميل</th>
                <th>الحالة</th>
                <th>قيمة العقد</th>
                <th>الإيرادات</th>
                <th>المصروفات</th>
                <th>الصافي</th>
                <th>المتبقي</th>
                <th>الإنجاز</th>
                <th>القيود</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <small>{row.code}</small>
                  </td>
                  <td>{row.client}</td>
                  <td>
                    <span className={`reports-status is-${row.status}`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td>{formatMoneyInteger(row.contractValue)}</td>
                  <td className="is-positive">{formatMoneyInteger(row.income)}</td>
                  <td className="is-negative">{formatMoneyInteger(row.expense)}</td>
                  <td className={row.net >= 0 ? 'is-positive' : 'is-negative'}>
                    {formatMoneyInteger(row.net)}
                  </td>
                  <td>{formatMoneyInteger(row.remaining)}</td>
                  <td>
                    <div className="reports-progress">
                      <span style={{ width: `${row.progress}%` }} />
                    </div>
                    <small>{row.progress}%</small>
                  </td>
                  <td>{row.entryCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

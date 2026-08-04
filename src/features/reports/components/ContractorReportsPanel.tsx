import { RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import type {
  ContractorReportEntry,
  ContractorReportsFilters,
  ContractorReportsViewModel,
} from '../types/contractor-reports.types'

type ContractorReportSection =
  'overview' | 'statement' | 'projects' | 'categories' | 'monthly' | 'payments' | 'quality'

type Props = {
  data: ContractorReportsViewModel
  filters: ContractorReportsFilters
  hasActiveFilter: boolean
  isFetching: boolean
  page: number
  totalPages: number
  totalCount: number
  paginatedEntries: ContractorReportEntry[]
  filtersDirty: boolean
  onSetFilter: <K extends keyof ContractorReportsFilters>(key: K, value: ContractorReportsFilters[K]) => void
  onSearch: () => void
  onReset: () => void
  onPageChange: (page: number) => void
  onSectionChange?: (section: ContractorReportSection) => void
}

const SECTIONS: { key: ContractorReportSection; label: string }[] = [
  { key: 'overview', label: 'الملخص والترتيب' },
  { key: 'statement', label: 'كشف الحساب' },
  { key: 'projects', label: 'حسب المشروع' },
  { key: 'categories', label: 'البنود' },
  { key: 'monthly', label: 'النشاط الشهري' },
  { key: 'payments', label: 'طرق الدفع' },
  { key: 'quality', label: 'جودة البيانات' },
]

function typeLabel(type: ContractorReportEntry['entryType']): string {
  if (type === 'income') return 'إيراد'
  if (type === 'expense') return 'مصروف'
  return 'غير معروف'
}

export function ContractorReportsPanel({
  data,
  filters,
  hasActiveFilter,
  isFetching,
  page,
  totalPages,
  totalCount,
  paginatedEntries,
  filtersDirty,
  onSetFilter,
  onSearch,
  onReset,
  onPageChange,
  onSectionChange,
}: Props) {
  const [section, setSection] = useState<ContractorReportSection>('overview')
  const { overview } = data

  return (
    <section className="contractor-reports" aria-busy={isFetching}>
      <header className="contractor-reports__header">
        <div>
          <span className="reports-label">تقارير المقاولين</span>
          <h2>تحليلات وحركة المقاولين</h2>
          <p>تقارير موحدة للحركة والتكلفة والمشروعات والبنود وجودة البيانات.</p>
        </div>
      </header>

      <div className="contractor-report-filters">
        <label>
          <span>بحث</span>
          <input
            value={filters.query}
            placeholder="مقاول، مشروع، بند أو بيان"
            onChange={(event) => onSetFilter('query', event.target.value)}
          />
        </label>
        <label>
          <span>المقاول</span>
          <select
            value={filters.contractorName}
            onChange={(event) => onSetFilter('contractorName', event.target.value)}
          >
            <option value="">كل المقاولين</option>
            {data.contractorOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>المشروع</span>
          <select
            value={filters.projectId}
            onChange={(event) => onSetFilter('projectId', event.target.value)}
          >
            <option value="">كل المشاريع</option>
            {data.projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>البند</span>
          <select value={filters.category} onChange={(event) => onSetFilter('category', event.target.value)}>
            <option value="">كل البنود</option>
            {data.categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>النوع</span>
          <select
            value={filters.entryType}
            onChange={(event) =>
              onSetFilter('entryType', event.target.value as ContractorReportsFilters['entryType'])
            }
          >
            <option value="all">الكل</option>
            <option value="income">إيراد</option>
            <option value="expense">مصروف</option>
            <option value="unknown">غير معروف</option>
          </select>
        </label>
        <label>
          <span>من تاريخ</span>
          <input
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(event) => onSetFilter('dateFrom', event.target.value)}
          />
        </label>
        <label>
          <span>إلى تاريخ</span>
          <input
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(event) => onSetFilter('dateTo', event.target.value)}
          />
        </label>
        <button type="button" className="jf-search-btn" onClick={onSearch}>
          <Search size={14} aria-hidden />
          بحث
        </button>
        <button type="button" onClick={onReset} disabled={!hasActiveFilter}>
          <RotateCcw size={16} aria-hidden />
          إعادة الضبط
        </button>
      </div>

      {filtersDirty && (
        <p className="jf-dirty-hint" role="status">
          تم تعديل الفلاتر، اضغط بحث لتحديث النتائج.
        </p>
      )}

      <div className="contractor-report-kpis">
        <article>
          <span>عدد المقاولين</span>
          <strong>{overview.contractorCount}</strong>
        </article>
        <article>
          <span>إجمالي المصروفات</span>
          <strong>{formatMoneyInteger(overview.totalExpense)}</strong>
        </article>
        <article>
          <span>إجمالي الإيرادات</span>
          <strong>{formatMoneyInteger(overview.totalIncome)}</strong>
        </article>
        <article>
          <span>صافي الحركة</span>
          <strong>{formatMoneyInteger(overview.netMovement)}</strong>
        </article>
        <article>
          <span>المشاريع المرتبطة</span>
          <strong>{overview.projectCount}</strong>
        </article>
        <article>
          <span>عدد القيود</span>
          <strong>{overview.entryCount}</strong>
        </article>
      </div>

      <div className="contractor-report-tabs" role="tablist" aria-label="أقسام تقارير المقاولين">
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={section === item.key}
            onClick={() => {
              setSection(item.key)
              onSectionChange?.(item.key)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div className="contractor-report-grid">
          <article className="contractor-highlight">
            <span>أعلى مقاول تكلفة</span>
            <strong>{overview.topCostContractor?.contractorName ?? 'لا يوجد'}</strong>
            <small>
              {overview.topCostContractor ? formatMoneyInteger(overview.topCostContractor.totalExpense) : '—'}
            </small>
          </article>
          <div className="contractor-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المقاول</th>
                  <th>المشاريع</th>
                  <th>الإيرادات</th>
                  <th>المصروفات</th>
                  <th>الصافي</th>
                  <th>القيود</th>
                  <th>متوسط القيد</th>
                  <th>آخر حركة</th>
                </tr>
              </thead>
              <tbody>
                {data.contractors.map((row) => (
                  <tr key={row.contractorName}>
                    <td>{row.contractorName}</td>
                    <td>{row.projectCount}</td>
                    <td>{formatMoneyInteger(row.totalIncome)}</td>
                    <td>{formatMoneyInteger(row.totalExpense)}</td>
                    <td>{formatMoneyInteger(row.netMovement)}</td>
                    <td>{row.entryCount}</td>
                    <td>{formatMoneyInteger(row.averageEntryAmount)}</td>
                    <td>{formatAccountingDate(row.lastActivityDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'statement' && (
        <div className="contractor-table-wrap">
          <table>
            <thead>
              <tr>
                <th>رقم</th>
                <th>التاريخ</th>
                <th>المقاول</th>
                <th>المشروع</th>
                <th>البند</th>
                <th>البيان</th>
                <th>النوع</th>
                <th>طريقة الدفع</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.entryNumber ?? '—'}</td>
                  <td>{formatAccountingDate(entry.entryDate)}</td>
                  <td>{entry.contractorName}</td>
                  <td>{entry.projectName}</td>
                  <td>{entry.category}</td>
                  <td>{entry.description}</td>
                  <td>{typeLabel(entry.entryType)}</td>
                  <td>{entry.paymentMethod}</td>
                  <td>{formatMoneyInteger(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="contractor-pagination">
            <span>
              {totalCount} قيد — صفحة {page} من {totalPages}
            </span>
            <div>
              <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                السابق
              </button>
              <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {section === 'projects' && (
        <SimpleTable
          headers={['المقاول', 'المشروع', 'الإيرادات', 'المصروفات', 'الصافي', 'القيود']}
          rows={data.contractorProjects.map((r) => [
            r.contractorName,
            r.projectName,
            formatMoneyInteger(r.totalIncome),
            formatMoneyInteger(r.totalExpense),
            formatMoneyInteger(r.netMovement),
            r.entryCount,
          ])}
        />
      )}
      {section === 'categories' && (
        <SimpleTable
          headers={['المقاول', 'البند', 'المصروفات', 'القيود', 'النسبة']}
          rows={data.categories.map((r) => [
            r.contractorName,
            r.category,
            formatMoneyInteger(r.totalExpense),
            r.entryCount,
            `${r.percentageOfContractorExpense}%`,
          ])}
        />
      )}
      {section === 'monthly' && (
        <SimpleTable
          headers={['المقاول', 'الشهر', 'الإيرادات', 'المصروفات', 'الصافي', 'القيود']}
          rows={data.monthlyActivity.map((r) => [
            r.contractorName,
            r.monthKey,
            formatMoneyInteger(r.totalIncome),
            formatMoneyInteger(r.totalExpense),
            formatMoneyInteger(r.netMovement),
            r.entryCount,
          ])}
        />
      )}
      {section === 'payments' && (
        <SimpleTable
          headers={['المقاول', 'طريقة الدفع', 'القيمة', 'القيود', 'النسبة']}
          rows={data.paymentMethods.map((r) => [
            r.contractorName,
            r.paymentMethod,
            formatMoneyInteger(r.totalAmount),
            r.entryCount,
            `${r.percentageOfContractorMovement}%`,
          ])}
        />
      )}
      {section === 'quality' && (
        <SimpleTable
          headers={['الملاحظة', 'عدد القيود', 'إجمالي المبالغ']}
          rows={data.dataQuality.map((r) => [r.label, r.count, formatMoneyInteger(r.totalAmount)])}
        />
      )}
    </section>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="contractor-table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length}>لا توجد بيانات مطابقة.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

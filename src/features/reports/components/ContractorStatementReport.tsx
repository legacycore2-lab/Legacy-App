import { RotateCcw, Search } from 'lucide-react'
import { ContractorStatementPanel } from './ContractorStatementPanel'
import type { ContractorReportsFilters, ContractorReportsViewModel } from '../types/contractor-reports.types'
import type { ContractorStatementViewModel } from '../types/contractor-statement.types'

type Props = {
  data: ContractorReportsViewModel
  statement: ContractorStatementViewModel
  filters: ContractorReportsFilters
  committedFilters: ContractorReportsFilters
  filtersDirty: boolean
  isFetching: boolean
  onSetFilter: <K extends keyof ContractorReportsFilters>(key: K, value: ContractorReportsFilters[K]) => void
  onSearch: () => void
  onReset: () => void
}

export function ContractorStatementReport({
  data,
  statement,
  filters,
  committedFilters,
  filtersDirty,
  isFetching,
  onSetFilter,
  onSearch,
  onReset,
}: Props) {
  return (
    <section className="contractor-statement-report" aria-busy={isFetching}>
      <header className="contractor-statement-report__heading">
        <div>
          <span className="reports-label">تقارير المقاولين</span>
          <h2>كشف حساب المقاول</h2>
          <p>اختر المقاول والفترة ثم اضغط بحث لعرض دفعاته بالترتيب الزمني.</p>
        </div>
      </header>

      <div className="contractor-statement-filters">
        <label>
          <span>المقاول</span>
          <select
            value={filters.contractorName}
            onChange={(event) => onSetFilter('contractorName', event.target.value)}
          >
            <option value="">اختر المقاول</option>
            {data.contractorOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>المشروع</span>
          <select value={filters.projectId} onChange={(event) => onSetFilter('projectId', event.target.value)}>
            <option value="">كل المشاريع</option>
            {data.projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
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
        <button type="button" className="jf-search-btn" onClick={onSearch} disabled={!filters.contractorName}>
          <Search size={15} aria-hidden />
          بحث
        </button>
        <button type="button" className="jf-reset" onClick={onReset}>
          <RotateCcw size={14} aria-hidden />
          إعادة الضبط
        </button>
      </div>

      {filtersDirty && (
        <p className="jf-dirty-hint" role="status">
          تم تعديل البيانات، اضغط بحث لتحديث كشف الحساب.
        </p>
      )}

      <ContractorStatementPanel
        statement={statement}
        dateFrom={committedFilters.dateFrom}
        dateTo={committedFilters.dateTo}
      />
    </section>
  )
}

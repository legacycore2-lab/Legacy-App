import { ArrowDownCircle, ArrowUpCircle, Eye, FileSpreadsheet, FileText, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useJournalPermissions } from '../hooks/useJournalPermissions'
import '../styles/journal-reversal.css'
import type { JournalEntry, JournalFilters, JournalSummary } from '../types/journal.types'
import { JournalDetailsDialog } from './JournalDetailsDialog'
import { JournalImportDialog } from './JournalImportDialog'
import { SingleLineJournalForm } from './SingleLineJournalForm'

const currency = new Intl.NumberFormat('ar-EG')

type Props = {
  entries: JournalEntry[]
  summary: JournalSummary
  filters: JournalFilters
  onFiltersChange: (filters: JournalFilters) => void
  onResetFilters: () => void
  page: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
  isLoading: boolean
  isRefreshing: boolean
  error: string
  openEntryOnLoad?: boolean
}

export function JournalView({
  entries,
  summary,
  filters,
  onFiltersChange,
  onResetFilters,
  page,
  totalPages,
  onPreviousPage,
  onNextPage,
  isLoading,
  isRefreshing,
  error,
  openEntryOnLoad = false,
}: Props) {
  const { canAccountingDelete, canManageAttachments, canReverse } = useJournalPermissions()
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(openEntryOnLoad)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const hasActiveFilters = Boolean(
    filters.query || filters.type !== 'all' || filters.dateFrom || filters.dateTo,
  )

  return (
    <section className="journal-page">
      <header className="journal-header">
        <div>
          <span>العمليات المالية</span>
          <h1>القيود اليومية</h1>
          <p>إدارة ومراجعة جميع حركات الإيرادات والمصروفات.</p>
        </div>
        <div className="journal-header-actions">
          <button type="button" className="journal-secondary" onClick={() => setIsImportOpen(true)}>
            <FileSpreadsheet size={18} /> استيراد Excel
          </button>
          <button type="button" className="journal-primary" onClick={() => setIsEntryFormOpen(true)}>
            <Plus size={18} /> إضافة قيد
          </button>
        </div>
      </header>

      {isEntryFormOpen && <SingleLineJournalForm onClose={() => setIsEntryFormOpen(false)} />}
      <JournalImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <JournalDetailsDialog
        entryId={selectedEntryId}
        onClose={() => setSelectedEntryId(null)}
        canAccountingDelete={canAccountingDelete}
        canReverse={canReverse}
        canManageAttachments={canManageAttachments}
      />

      <div className="journal-stats">
        <article>
          <FileText />
          <span>إجمالي القيود</span>
          <strong>{currency.format(summary.totalCount)}</strong>
        </article>
        <article>
          <ArrowUpCircle />
          <span>إيرادات الصفحة</span>
          <strong>{currency.format(summary.pageIncome)} ج.م</strong>
        </article>
        <article>
          <ArrowDownCircle />
          <span>مصروفات الصفحة</span>
          <strong>{currency.format(summary.pageExpense)} ج.م</strong>
        </article>
        <article>
          <FileText />
          <span>صافي الصفحة</span>
          <strong>{currency.format(summary.pageNet)} ج.م</strong>
        </article>
      </div>

      <div className="journal-toolbar">
        <label>
          <Search size={17} />
          <input
            value={filters.query}
            onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
            placeholder="ابحث بالكود أو البند أو البيان أو المقاول..."
          />
        </label>
        <select
          value={filters.type}
          onChange={(event) =>
            onFiltersChange({ ...filters, type: event.target.value as JournalFilters['type'] })
          }
        >
          <option value="all">كل الحركات</option>
          <option value="income">إيرادات</option>
          <option value="expense">مصروفات</option>
        </select>
        <label>
          <span>من</span>
          <input
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(event) => onFiltersChange({ ...filters, dateFrom: event.target.value })}
          />
        </label>
        <label>
          <span>إلى</span>
          <input
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(event) => onFiltersChange({ ...filters, dateTo: event.target.value })}
          />
        </label>
        {hasActiveFilters && (
          <button type="button" className="journal-secondary" onClick={onResetFilters}>
            إعادة الضبط
          </button>
        )}
      </div>

      <div className="journal-table-wrap">
        {isLoading && <div className="journal-state">جاري تحميل القيود...</div>}
        {error && <div className="journal-state journal-error">{error}</div>}
        {!isLoading && !error && entries.length === 0 && (
          <div className="journal-state">
            <FileText size={34} />
            <h2>لا توجد قيود لعرضها</h2>
            <p>ستظهر القيود هنا بعد إضافة أول قيد أو تغيير الفلاتر.</p>
          </div>
        )}
        {!isLoading && !error && entries.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>رقم القيد</th>
                <th>التاريخ</th>
                <th>المشروع</th>
                <th>النوع</th>
                <th>البند</th>
                <th>البيان</th>
                <th>المقاول</th>
                <th>طريقة الدفع</th>
                <th>المبلغ</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={entry.isReversal ? 'journal-row--reversal' : undefined}>
                  <td>
                    #{entry.sequence}
                    {entry.isReversal && <span className="journal-reversal-badge">قيد عكسي</span>}
                  </td>
                  <td>{entry.entryDate}</td>
                  <td>{entry.projectName}</td>
                  <td>
                    <span className={`journal-type journal-type--${entry.type}`}>
                      {entry.type === 'income' ? 'إيراد' : 'مصروف'}
                    </span>
                  </td>
                  <td>{entry.category}</td>
                  <td>{entry.description}</td>
                  <td>{entry.contractor || '—'}</td>
                  <td>{entry.paymentMethod || '—'}</td>
                  <td>{currency.format(entry.amount)} ج.م</td>
                  <td>
                    <button
                      type="button"
                      className="journal-view-button"
                      onClick={() => setSelectedEntryId(entry.id)}
                      title="عرض تفاصيل القيد"
                    >
                      <Eye size={16} /> عرض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !error && summary.totalCount > 0 && (
        <nav className="journal-pagination" aria-label="صفحات القيود">
          <button type="button" onClick={onPreviousPage} disabled={page <= 1 || isRefreshing}>
            السابق
          </button>
          <span>
            صفحة {currency.format(page)} من {currency.format(totalPages)}
            {isRefreshing ? ' · جاري التحديث' : ''}
          </span>
          <button type="button" onClick={onNextPage} disabled={page >= totalPages || isRefreshing}>
            التالي
          </button>
        </nav>
      )}
    </section>
  )
}

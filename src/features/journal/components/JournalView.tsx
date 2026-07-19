import { ArrowDownCircle, ArrowUpCircle, FileText, Plus, Search } from 'lucide-react'
import type { JournalEntry, JournalFilters } from '../types/journal.types'

const currency = new Intl.NumberFormat('ar-EG')

type Props = {
  entries: JournalEntry[]
  allEntries: JournalEntry[]
  filters: JournalFilters
  onFiltersChange: (filters: JournalFilters) => void
  isLoading: boolean
  error: string
}

export function JournalView({ entries, allEntries, filters, onFiltersChange, isLoading, error }: Props) {
  const income = allEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expense = allEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <section className="journal-page">
      <header className="journal-header">
        <div><span>العمليات المالية</span><h1>القيود اليومية</h1><p>إدارة ومراجعة جميع حركات الإيرادات والمصروفات.</p></div>
        <button type="button" className="journal-primary" disabled title="سيتم تفعيل الإضافة في المرحلة التالية"><Plus size={18}/> إضافة قيد</button>
      </header>

      <div className="journal-stats">
        <article><FileText/><span>إجمالي القيود</span><strong>{currency.format(allEntries.length)}</strong></article>
        <article><ArrowUpCircle/><span>إجمالي الإيرادات</span><strong>{currency.format(income)} ج.م</strong></article>
        <article><ArrowDownCircle/><span>إجمالي المصروفات</span><strong>{currency.format(expense)} ج.م</strong></article>
        <article><FileText/><span>صافي الحركة</span><strong>{currency.format(income - expense)} ج.م</strong></article>
      </div>

      <div className="journal-toolbar">
        <label><Search size={17}/><input value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} placeholder="ابحث بالمشروع أو البند أو المقاول..." /></label>
        <select value={filters.type} onChange={(event) => onFiltersChange({ ...filters, type: event.target.value as JournalFilters['type'] })}>
          <option value="all">كل الحركات</option><option value="income">إيرادات</option><option value="expense">مصروفات</option>
        </select>
      </div>

      <div className="journal-table-wrap">
        {isLoading && <div className="journal-state">جاري تحميل القيود...</div>}
        {error && <div className="journal-state journal-error">{error}</div>}
        {!isLoading && !error && entries.length === 0 && <div className="journal-state"><FileText size={34}/><h2>لا توجد قيود لعرضها</h2><p>ستظهر القيود هنا بعد ربط قاعدة البيانات أو إضافة أول قيد.</p></div>}
        {!isLoading && !error && entries.length > 0 && <table><thead><tr><th>رقم القيد</th><th>التاريخ</th><th>المشروع</th><th>النوع</th><th>البند</th><th>البيان</th><th>المقاول</th><th>طريقة الدفع</th><th>المبلغ</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>#{entry.sequence}</td><td>{entry.entryDate}</td><td>{entry.projectName}</td><td><span className={`journal-type journal-type--${entry.type}`}>{entry.type === 'income' ? 'إيراد' : 'مصروف'}</span></td><td>{entry.category}</td><td>{entry.description}</td><td>{entry.contractor || '—'}</td><td>{entry.paymentMethod || '—'}</td><td>{currency.format(entry.amount)} ج.م</td></tr>)}</tbody></table>}
      </div>
    </section>
  )
}

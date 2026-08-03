import { ArrowDownLeft, ArrowUpRight, ClipboardList, Plus, Scale } from 'lucide-react'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ProjectJournalViewModel } from '../types/project.types'

function Currency({ value }: { value: number }) {
  return (
    <bdi dir="ltr" className="project-command__currency">
      {formatMoneyInteger(value)}
    </bdi>
  )
}

type Props = {
  journalViewModel: ProjectJournalViewModel
  onAddEntry: () => void
}

export function WorkspaceJournalTab({ journalViewModel, onAddEntry }: Props) {
  const { entries, summary, hasEntries } = journalViewModel

  return (
    <div className="project-journal-tab">
      <div className="project-journal-tab__header">
        <div>
          <span>دفتر المشروع</span>
          <h2>القيود اليومية الخاصة بالمشروع</h2>
          <p>جميع الإيرادات والمصروفات المرتبطة بهذا المشروع فقط.</p>
        </div>
        <button type="button" className="project-workspace__quick-button is-primary" onClick={onAddEntry}>
          <Plus size={17} /> إضافة قيد
        </button>
      </div>

      <div className="project-journal-tab__summary">
        <article className="is-income">
          <ArrowDownLeft size={20} />
          <span>إجمالي الإيرادات</span>
          <strong>
            <Currency value={summary.totalIncome} />
          </strong>
        </article>
        <article className="is-expense">
          <ArrowUpRight size={20} />
          <span>إجمالي المصروفات</span>
          <strong>
            <Currency value={summary.totalExpense} />
          </strong>
        </article>
        <article className="is-balance">
          <Scale size={20} />
          <span>صافي الحركة</span>
          <strong>
            <Currency value={summary.balance} />
          </strong>
        </article>
        <article className="is-count">
          <ClipboardList size={20} />
          <span>عدد القيود</span>
          <strong>{summary.entryCount}</strong>
        </article>
      </div>

      {!hasEntries ? (
        <article className="project-command__panel project-journal-tab__empty">
          <ClipboardList size={32} />
          <h3>لا توجد قيود لهذا المشروع</h3>
          <p>ابدأ بإضافة أول قيد وسيظهر هنا تلقائيًا.</p>
          <button type="button" className="project-workspace__quick-button is-primary" onClick={onAddEntry}>
            <Plus size={17} /> إضافة أول قيد
          </button>
        </article>
      ) : (
        <article className="project-command__panel project-journal-tab__table-card">
          <div className="project-command__panel-heading">
            <div>
              <span>السجل المالي</span>
              <h2>آخر القيود المسجلة</h2>
            </div>
            <strong>{entries.length} قيد</strong>
          </div>

          <div className="project-journal-tab__table-wrap">
            <table className="project-journal-tab__table">
              <thead>
                <tr>
                  <th>رقم القيد</th>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>البند</th>
                  <th>البيان</th>
                  <th>المقاول</th>
                  <th>طريقة الدفع</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="رقم القيد">{entry.seq ?? '—'}</td>
                    <td data-label="التاريخ">{formatAccountingDate(entry.entryDate)}</td>
                    <td data-label="النوع">
                      <span className={`project-journal-tab__type is-${entry.type}`}>
                        {entry.type === 'income' ? 'إيراد' : entry.type === 'expense' ? 'مصروف' : 'غير معروف'}
                      </span>
                    </td>
                    <td data-label="البند">{entry.category || 'غير مصنف'}</td>
                    <td data-label="البيان">{entry.description || 'بدون بيان'}</td>
                    <td data-label="المقاول">{entry.contractor || '—'}</td>
                    <td data-label="طريقة الدفع">{entry.paymentMethod || '—'}</td>
                    <td data-label="المبلغ" className={`is-${entry.type}`}>
                      <Currency value={entry.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </div>
  )
}

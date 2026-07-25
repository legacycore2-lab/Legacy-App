import { AlertTriangle, Trash2, X } from 'lucide-react'
import type { JournalEntry } from '../types/journal.types'

type Props = {
  entry: JournalEntry
  isDeleting: boolean
  error: string
  onConfirm: () => void
  onCancel: () => void
}

const currency = new Intl.NumberFormat('ar-EG')

export function DeleteConfirmDialog({ entry, isDeleting, error, onConfirm, onCancel }: Props) {
  return (
    <div className="journal-details-backdrop" role="presentation">
      <section
        className="journal-details-dialog journal-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="تأكيد حذف القيد"
      >
        <header>
          <div>
            <span>تأكيد الحذف</span>
            <h2>حذف قيد #{entry.sequence}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="إغلاق">
            <X size={18} />
          </button>
        </header>

        <div className="journal-delete-body">
          <div className="journal-delete-warning">
            <AlertTriangle size={22} />
            <p>هذا الإجراء لا يمكن التراجع عنه. سيُحذف القيد وقيده اليومي نهائيًا.</p>
          </div>

          <dl className="journal-details-summary">
            <div>
              <dt>التاريخ</dt>
              <dd>{entry.entryDate}</dd>
            </div>
            <div>
              <dt>المشروع</dt>
              <dd>{entry.projectName}</dd>
            </div>
            <div>
              <dt>البند</dt>
              <dd>{entry.category}</dd>
            </div>
            <div>
              <dt>المبلغ</dt>
              <dd>{currency.format(entry.amount)} ج.م</dd>
            </div>
          </dl>

          {error && (
            <div className="journal-entry-errors">
              <p>{error}</p>
            </div>
          )}

          <footer className="journal-delete-footer">
            <button
              type="button"
              className="journal-secondary"
              onClick={onCancel}
              disabled={isDeleting}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="journal-danger"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              {isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

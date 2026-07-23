import { Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useDeleteEntry } from '../hooks/useDeleteEntry'
import { useJournalDetails } from '../hooks/useJournalDetails'

type Props = {
  entryId: string | null
  onClose: () => void
}

const money = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const statusLabel = { draft: 'مسودة', posted: 'مرحّل', reversed: 'معكوس' }

export function JournalDetailsDialog({ entryId, onClose }: Props) {
  const { details, isLoading, error } = useJournalDetails(entryId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { deleteEntry, isDeleting, error: deleteError } = useDeleteEntry(() => {
    setConfirmDelete(false)
    onClose()
  })

  if (!entryId) return null

  return (
    <div className="journal-details-backdrop" role="presentation">
      <section className="journal-details-dialog" role="dialog" aria-modal="true" aria-label="تفاصيل القيد">
        <header>
          <div>
            <span>تفاصيل الحركة المحاسبية</span>
            <h2>{details ? `قيد رقم ${details.journalNumber}` : 'تفاصيل القيد'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </header>

        {isLoading && <div className="journal-details-state">جارٍ تحميل تفاصيل القيد...</div>}
        {error && <div className="journal-details-state journal-error">{error}</div>}
        {!isLoading && !error && !details && (
          <div className="journal-details-state">هذا قيد قديم ولا توجد له تفاصيل محاسبية مرتبطة.</div>
        )}

        {details && (
          <div className="journal-details-content">
            <dl className="journal-details-summary">
              <div>
                <dt>التاريخ</dt>
                <dd>{details.journalDate}</dd>
              </div>
              <div>
                <dt>المشروع</dt>
                <dd>{details.projectName}</dd>
              </div>
              <div>
                <dt>الحالة</dt>
                <dd>{statusLabel[details.status]}</dd>
              </div>
              <div>
                <dt>البيان</dt>
                <dd>{details.description}</dd>
              </div>
            </dl>

            <div className="journal-details-lines">
              <table>
                <thead>
                  <tr>
                    <th>الحساب</th>
                    <th>مدين</th>
                    <th>دائن</th>
                  </tr>
                </thead>
                <tbody>
                  {details.lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <strong>{line.accountName}</strong>
                        <small>{line.accountCode}</small>
                      </td>
                      <td>{line.debit ? `${money.format(line.debit)} ج.م` : '—'}</td>
                      <td>{line.credit ? `${money.format(line.credit)} ج.م` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>الإجمالي</th>
                    <th>{money.format(details.totalDebit)} ج.م</th>
                    <th>{money.format(details.totalCredit)} ج.م</th>
                  </tr>
                </tfoot>
              </table>
            </div>

            {!confirmDelete && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="journal-delete-btn"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={15} />
                  حذف القيد
                </button>
              </div>
            )}

            {confirmDelete && (
              <div className="journal-delete-confirm">
                <span>هل أنت متأكد من حذف هذا القيد؟ لا يمكن التراجع عن هذه العملية.</span>
                <div className="journal-delete-confirm-actions">
                  <button
                    type="button"
                    className="confirm-no"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className="confirm-yes"
                    onClick={() => deleteEntry(entryId)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
                  </button>
                </div>
              </div>
            )}

            {deleteError && (
              <div className="journal-entry-errors" style={{ marginTop: '12px' }}>
                <p>{deleteError}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

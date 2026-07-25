import { Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useJournalActions } from '../hooks/useJournalActions'
import { useJournalDetails } from '../hooks/useJournalDetails'

type Props = {
  entryId: string | null
  onClose: () => void
}

const money = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const statusLabel = { draft: 'مسودة', posted: 'مرحّل', reversed: 'معكوس' }

export function JournalDetailsDialog({ entryId, onClose }: Props) {
  const { details, isLoading, error } = useJournalDetails(entryId)
  const { forceDeleteEntry, isForceDeleting, forceDeleteError } = useJournalActions()
  const [showForceDelete, setShowForceDelete] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')

  if (!entryId) return null

  const canSubmitForceDelete = confirmation === 'DELETE' && reason.trim().length >= 5 && !isForceDeleting

  const handleForceDelete = async () => {
    if (!canSubmitForceDelete) return
    await forceDeleteEntry(entryId, reason)
    onClose()
  }

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

            {!showForceDelete && (
              <div className="journal-danger-actions">
                <button type="button" className="journal-force-delete-button" onClick={() => setShowForceDelete(true)}>
                  <Trash2 size={16} />
                  حذف نهائي
                </button>
              </div>
            )}

            {showForceDelete && (
              <div className="journal-force-delete-panel" aria-label="تأكيد الحذف النهائي">
                <strong>تحذير: سيتم حذف القيد وكل سطوره المحاسبية نهائيًا.</strong>
                <p>هذه العملية مخصصة للمدير فقط، ولا يمكن التراجع عنها. ستُحفظ نسخة من القيد في سجل المراجعة.</p>

                <label>
                  سبب الحذف
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="اكتب سببًا واضحًا للحذف النهائي"
                    rows={3}
                    disabled={isForceDeleting}
                  />
                </label>

                <label>
                  اكتب DELETE للتأكيد
                  <input
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="off"
                    disabled={isForceDeleting}
                  />
                </label>

                {forceDeleteError && <div className="journal-entry-errors">{forceDeleteError}</div>}

                <div className="journal-force-delete-actions">
                  <button
                    type="button"
                    className="journal-secondary"
                    onClick={() => {
                      setShowForceDelete(false)
                      setConfirmation('')
                      setReason('')
                    }}
                    disabled={isForceDeleting}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className="journal-force-delete-confirm"
                    onClick={handleForceDelete}
                    disabled={!canSubmitForceDelete}
                  >
                    <Trash2 size={16} />
                    {isForceDeleting ? 'جارٍ الحذف النهائي...' : 'تأكيد الحذف النهائي'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

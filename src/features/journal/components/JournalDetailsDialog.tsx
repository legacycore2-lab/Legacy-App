import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
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
  const { user } = useAuth()
  const { forceDeleteEntry, isForceDeleting, forceDeleteError } = useJournalActions()

  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const canDelete = confirmText === 'DELETE' && reason.trim().length >= 5 && !isForceDeleting

  const handleForceDelete = async () => {
    if (!entryId || !canDelete) return
    try {
      await forceDeleteEntry(entryId, reason)
      onClose()
    } catch {
      // error shown in UI
    }
  }

  const resetConfirm = () => {
    setShowConfirm(false)
    setReason('')
    setConfirmText('')
  }

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

        {details && !showConfirm && (
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

            {isAdmin && (
              <div className="journal-details-admin-actions">
                <button
                  type="button"
                  className="journal-force-delete-btn"
                  onClick={() => setShowConfirm(true)}
                >
                  <Trash2 size={15} />
                  حذف نهائي
                </button>
              </div>
            )}
          </div>
        )}

        {details && showConfirm && (
          <div className="journal-force-delete-panel">
            <div className="journal-force-delete-warning">
              <AlertTriangle size={22} />
              <p>
                هذا الإجراء <strong>لا يمكن التراجع عنه</strong>. سيُحذف القيد وقيده اليومي نهائيًا ويُسجَّل
                في سجل المراجعة.
              </p>
            </div>

            <label className="journal-force-delete-label">
              سبب الحذف <span>(5 أحرف على الأقل)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سبب الحذف..."
                rows={3}
                disabled={isForceDeleting}
              />
            </label>

            <label className="journal-force-delete-label">
              تأكيد الحذف — اكتب <strong>DELETE</strong>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={isForceDeleting}
                dir="ltr"
              />
            </label>

            {forceDeleteError && <div className="journal-force-delete-error">{forceDeleteError}</div>}

            <div className="journal-force-delete-footer">
              <button
                type="button"
                className="journal-force-delete-cancel"
                onClick={resetConfirm}
                disabled={isForceDeleting}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="journal-force-delete-confirm"
                onClick={handleForceDelete}
                disabled={!canDelete}
              >
                <Trash2 size={15} />
                {isForceDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف النهائي'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

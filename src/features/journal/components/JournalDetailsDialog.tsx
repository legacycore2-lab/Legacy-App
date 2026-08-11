import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useDialogAccessibility } from '../../../shared/hooks/useDialogAccessibility'
import { useJournalActions } from '../hooks/useJournalActions'
import { useJournalDetails } from '../hooks/useJournalDetails'

type Props = {
  entryId: string | null
  onClose: () => void
  canForceDelete?: boolean
  canReverse?: boolean
}

const money = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const statusLabel = { draft: 'مسودة', posted: 'مرحّل', reversed: 'معكوس' }

export function JournalDetailsDialog({
  entryId,
  onClose,
  canForceDelete = false,
  canReverse = false,
}: Props) {
  const { details, isLoading, error } = useJournalDetails(entryId)
  const { reverseEntry, isReversing, reverseError, forceDeleteEntry, isForceDeleting, forceDeleteError } =
    useJournalActions()

  const [confirmMode, setConfirmMode] = useState<'reverse' | 'delete' | null>(null)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const actionInProgress = isReversing || isForceDeleting
  const canDelete = confirmText === 'DELETE' && reason.trim().length >= 5 && !actionInProgress
  const canConfirmReverse = confirmText === 'REVERSE' && !actionInProgress
  const dialogRef = useDialogAccessibility<HTMLElement>(entryId !== null, onClose, !actionInProgress)

  const handleReverse = async () => {
    if (!entryId || !canConfirmReverse) return
    try {
      await reverseEntry(entryId)
      onClose()
    } catch {
      // error shown in UI
    }
  }

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
    setConfirmMode(null)
    setReason('')
    setConfirmText('')
  }

  if (!entryId) return null

  return (
    <div className="journal-details-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="journal-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل القيد"
      >
        <header>
          <div>
            <span>تفاصيل الحركة المحاسبية</span>
            <h2>{details ? `قيد رقم ${details.journalNumber}` : 'تفاصيل القيد'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" disabled={actionInProgress}>
            <X size={18} />
          </button>
        </header>

        {isLoading && <div className="journal-details-state">جارٍ تحميل تفاصيل القيد...</div>}
        {error && <div className="journal-details-state journal-error">{error}</div>}
        {!isLoading && !error && !details && (
          <div className="journal-details-state">هذا قيد قديم ولا توجد له تفاصيل محاسبية مرتبطة.</div>
        )}

        {details && !confirmMode && (
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

            {(canReverse || canForceDelete) && (
              <div className="journal-details-admin-actions">
                {canReverse && details.status === 'posted' && (
                  <button
                    type="button"
                    className="journal-secondary"
                    onClick={() => setConfirmMode('reverse')}
                  >
                    <RotateCcw size={15} />
                    عكس القيد
                  </button>
                )}
                {canForceDelete && (
                  <button
                    type="button"
                    className="journal-force-delete-btn"
                    onClick={() => setConfirmMode('delete')}
                  >
                    <Trash2 size={15} />
                    حذف نهائي
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {details && confirmMode === 'reverse' && (
          <div className="journal-force-delete-panel">
            <div className="journal-force-delete-warning">
              <AlertTriangle size={22} />
              <p>
                سيتم إنشاء <strong>قيد عكسي جديد</strong> مع الاحتفاظ بالقيد الأصلي وسجل المراجعة.
              </p>
            </div>

            <label className="journal-force-delete-label">
              تأكيد العكس — اكتب <strong>REVERSE</strong>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="REVERSE"
                disabled={isReversing}
                dir="ltr"
              />
            </label>

            {reverseError && <div className="journal-force-delete-error">{reverseError}</div>}

            <div className="journal-force-delete-footer">
              <button
                type="button"
                className="journal-force-delete-cancel"
                onClick={resetConfirm}
                disabled={isReversing}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="journal-primary"
                onClick={handleReverse}
                disabled={!canConfirmReverse}
              >
                <RotateCcw size={15} />
                {isReversing ? 'جارٍ عكس القيد...' : 'تأكيد العكس'}
              </button>
            </div>
          </div>
        )}

        {details && confirmMode === 'delete' && (
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
                onChange={(event) => setReason(event.target.value)}
                placeholder="اكتب سبب الحذف..."
                rows={3}
                disabled={isForceDeleting}
              />
            </label>

            <label className="journal-force-delete-label">
              تأكيد الحذف — اكتب <strong>DELETE</strong>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
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

import { FileText, Image, Paperclip, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useJournalAttachmentActions, useJournalAttachments } from '../hooks/useJournalAttachments'

type Props = {
  entryId: string
  canManage: boolean
}

const size = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 })

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${size.format(bytes / 1024)} KB`
  return `${size.format(bytes / (1024 * 1024))} MB`
}

export function JournalAttachmentsPanel({ entryId, canManage }: Props) {
  const { attachments, isLoading, error } = useJournalAttachments(entryId)
  const {
    upload,
    isUploading,
    uploadError,
    remove,
    isDeleting,
    deleteError,
    cleanupWarning,
    getUrl,
    isOpening,
    openError,
    retryCleanup,
    isRetryingCleanup,
    cleanupResult,
  } = useJournalAttachmentActions(entryId)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleOpen = async (storagePath: string) => {
    try {
      const url = await getUrl(storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // error shown in UI
    }
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    try {
      await remove(pendingDeleteId)
      setPendingDeleteId(null)
    } catch {
      // error shown in UI
    }
  }

  return (
    <section className="journal-attachments" aria-labelledby="journal-attachments-title">
      <div className="journal-attachments-header">
        <div>
          <Paperclip size={17} />
          <strong id="journal-attachments-title">مرفقات القيد</strong>
        </div>
        {canManage && (
          <label className="journal-attachment-upload">
            <Upload size={15} />
            {isUploading ? 'جارٍ الرفع...' : 'إضافة مرفق'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file)
                event.currentTarget.value = ''
              }}
            />
          </label>
        )}
      </div>

      {isLoading && <p className="journal-attachment-state">جارٍ تحميل المرفقات...</p>}
      {error && <p className="journal-attachment-error">{error}</p>}
      {uploadError && <p className="journal-attachment-error">{uploadError}</p>}
      {deleteError && <p className="journal-attachment-error">{deleteError}</p>}
      {openError && <p className="journal-attachment-error">{openError}</p>}

      {!isLoading && !error && attachments.length === 0 && (
        <p className="journal-attachment-state">لا توجد مرفقات مرتبطة بهذا القيد.</p>
      )}

      {attachments.length > 0 && (
        <div className="journal-attachment-list">
          {attachments.map((attachment) => (
            <article key={attachment.id}>
              <div className="journal-attachment-icon">
                {attachment.mimeType === 'application/pdf' ? <FileText size={18} /> : <Image size={18} />}
              </div>
              <div className="journal-attachment-meta">
                <strong>{attachment.fileName}</strong>
                <span>{formatFileSize(attachment.sizeBytes)}</span>
              </div>
              <div className="journal-attachment-actions">
                <button
                  type="button"
                  className="journal-secondary"
                  onClick={() => void handleOpen(attachment.storagePath)}
                  disabled={isOpening}
                >
                  فتح
                </button>
                {canManage && (
                  <button
                    type="button"
                    className="journal-force-delete-btn"
                    onClick={() => setPendingDeleteId(attachment.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {pendingDeleteId && (
        <div className="journal-attachment-confirm">
          <p>هل تريد حذف هذا المرفق؟ لن يتم حذف القيد نفسه.</p>
          <div>
            <button
              type="button"
              className="journal-secondary"
              onClick={() => setPendingDeleteId(null)}
              disabled={isDeleting}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="journal-force-delete-btn"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              <Trash2 size={14} /> {isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
            </button>
          </div>
        </div>
      )}

      {cleanupWarning && (
        <div className="journal-attachment-warning">
          <p>تم حذف سجل المرفق، لكن تعذر تنظيف الملف من التخزين.</p>
          <button
            type="button"
            className="journal-secondary"
            onClick={() => void retryCleanup(cleanupWarning.storagePath)}
            disabled={isRetryingCleanup}
          >
            <RotateCcw size={14} />
            {isRetryingCleanup ? 'جارٍ إعادة المحاولة...' : 'إعادة محاولة التنظيف'}
          </button>
          {cleanupResult?.kind === 'failed' && <small>{cleanupResult.reason}</small>}
          {cleanupResult?.kind === 'success' && <small>تم تنظيف الملف بنجاح.</small>}
        </div>
      )}
    </section>
  )
}

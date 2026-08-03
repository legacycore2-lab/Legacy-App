import {
  AlertTriangle,
  FileText,
  Image,
  Loader2,
  Paperclip,
  RefreshCw,
  ShieldOff,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { formatAccountingDate } from '../../../shared/date-utils'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { useDialogAccessibility } from '../../../shared/hooks/useDialogAccessibility'
import type { ProjectEntry } from '../types/project.types'
import {
  useAttachmentSignedUrl,
  useDeleteAttachment,
  useProjectAttachments,
  useRetryCleanup,
  useUploadAttachment,
} from '../hooks/useProjectAttachments'
import type { Attachment, AttachmentCleanupWarning } from '../types/project-attachment.types'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../types/project-attachment.types'

type Props = {
  projectId: string
  /** All entries for this project — used for entry selection before upload */
  entries: ProjectEntry[]
}

const ACCEPT = ALLOWED_MIME_TYPES.join(',')

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType: string) {
  return mimeType.startsWith('image/') ? <Image size={18} /> : <FileText size={18} />
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  fileName,
  onConfirm,
  onCancel,
  isDeleting,
  deleteError,
}: {
  fileName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
  deleteError: string
}) {
  const dialogRef = useDialogAccessibility<HTMLDivElement>(true, onCancel, !isDeleting)

  return (
    <div
      ref={dialogRef}
      className="attachment-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="تأكيد الحذف"
    >
      <div className="attachment-confirm">
        <AlertTriangle size={28} className="attachment-confirm__icon" />
        <h3>حذف المرفق</h3>
        <p>
          هل تريد حذف <strong>{fileName}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        {deleteError && (
          <div className="workspace-attachments__error" role="alert">
            {deleteError}
          </div>
        )}
        <div className="attachment-confirm__actions">
          <button
            type="button"
            className="attachment-confirm__cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="attachment-confirm__delete"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
            {isDeleting ? 'جارٍ الحذف…' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cleanup warning banner ───────────────────────────────────────────────────

function CleanupWarningBanner({
  warning,
  onDismiss,
}: {
  warning: AttachmentCleanupWarning
  onDismiss: () => void
}) {
  const { retry, isRetrying, reset } = useRetryCleanup()
  const [retryError, setRetryError] = useState('')

  async function handleRetry() {
    setRetryError('')
    reset()
    const res = await retry(warning.storagePath)
    if (res.kind === 'success') {
      onDismiss()
    } else {
      setRetryError(res.reason)
    }
  }

  return (
    <div className="workspace-attachments__warning" role="alert">
      <span>
        تم حذف السجل لكن الملف قد لا يكون محذوفاً من التخزين.
        {retryError && <em className="workspace-attachments__retry-error"> {retryError}</em>}
      </span>
      <div className="workspace-attachments__warning-actions">
        <button type="button" onClick={() => void handleRetry()} disabled={isRetrying}>
          {isRetrying ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
          {isRetrying ? 'جارٍ المحاولة…' : 'إعادة المحاولة'}
        </button>
        <button type="button" onClick={onDismiss}>
          إغلاق
        </button>
      </div>
    </div>
  )
}

// ─── Attachment row ───────────────────────────────────────────────────────────

function AttachmentRow({
  attachment,
  projectId,
  onCleanupWarning,
}: {
  attachment: Attachment
  projectId: string
  onCleanupWarning: (w: AttachmentCleanupWarning) => void
}) {
  const { getUrl, isLoading: urlLoading } = useAttachmentSignedUrl()
  const { remove, isDeleting, deleteError } = useDeleteAttachment(projectId, onCleanupWarning)
  const [showConfirm, setShowConfirm] = useState(false)
  const [openError, setOpenError] = useState('')

  async function handleOpen() {
    setOpenError('')
    try {
      const url = await getUrl({ storagePath: attachment.storagePath })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      // Use the caught error directly — never read stale hook state inside catch
      setOpenError(toErrorMessage(err, 'تعذر فتح الملف.'))
    }
  }

  async function handleConfirmDelete() {
    try {
      await remove(attachment.id)
      setShowConfirm(false)
    } catch {
      // deleteError is surfaced via the hook and displayed inside ConfirmDeleteDialog
    }
  }

  return (
    <>
      <div className="attachment-row">
        <span className="attachment-row__icon">{fileIcon(attachment.mimeType)}</span>

        <div className="attachment-row__body">
          <button
            type="button"
            className="attachment-row__name"
            onClick={() => void handleOpen()}
            disabled={urlLoading}
            title="فتح الملف"
          >
            {urlLoading && <Loader2 size={13} className="spin" />}
            {attachment.fileName}
          </button>
          {openError && (
            <span className="attachment-row__open-error" role="alert">
              {openError}
            </span>
          )}
        </div>

        <span className="attachment-row__meta">{formatBytes(attachment.sizeBytes)}</span>

        <button
          type="button"
          className="attachment-row__delete"
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting}
          aria-label={`حذف ${attachment.fileName}`}
          title="حذف المرفق"
        >
          {isDeleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {showConfirm && (
        <ConfirmDeleteDialog
          fileName={attachment.fileName}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setShowConfirm(false)}
          isDeleting={isDeleting}
          deleteError={deleteError}
        />
      )}
    </>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function WorkspaceAttachmentsTab({ projectId, entries }: Props) {
  const { attachments, isLoading, error, isPermissionDenied } = useProjectAttachments(projectId)
  const { upload, isUploading, uploadError, reset } = useUploadAttachment(projectId)
  const [selectedEntryId, setSelectedEntryId] = useState<string>('')
  const [cleanupWarnings, setCleanupWarnings] = useState<AttachmentCleanupWarning[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleCleanupWarning(w: AttachmentCleanupWarning) {
    setCleanupWarnings((prev) => [...prev.filter((x) => x.attachmentId !== w.attachmentId), w])
  }

  function dismissWarning(attachmentId: string) {
    setCleanupWarnings((prev) => prev.filter((w) => w.attachmentId !== attachmentId))
  }

  // ── Permission error ──
  if (isPermissionDenied) {
    return (
      <div className="workspace-attachments__permission">
        <ShieldOff size={36} />
        <strong>غير مصرح بعرض المرفقات</strong>
        <span>تحتاج صلاحية محاسب أو أعلى للوصول إلى هذا القسم.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="workspace-attachments__error" role="alert">
        {error}
      </div>
    )
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedEntryId) return
    reset()
    try {
      await upload({ projectId, entryId: selectedEntryId, file })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const canUpload = !!selectedEntryId && !isUploading

  return (
    <div className="workspace-attachments">
      {/* ── Header ── */}
      <div className="workspace-attachments__header">
        <div>
          <span>الملفات</span>
          <h2>مرفقات المشروع</h2>
        </div>
        <div className="workspace-attachments__header-actions">
          <input
            ref={fileInputRef}
            id="attachment-file-input"
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={handleFileChange}
            disabled={!canUpload}
            aria-label="رفع مرفق"
          />
          <label
            htmlFor="attachment-file-input"
            className={`workspace-attachments__upload-btn${!canUpload ? ' is-disabled' : ''}`}
            title={!selectedEntryId ? 'اختر قيداً أولاً قبل رفع الملف' : undefined}
            aria-disabled={!canUpload}
          >
            {isUploading ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
            {isUploading ? 'جارٍ الرفع…' : 'رفع ملف'}
          </label>
        </div>
      </div>

      {/* ── Entry selector ── */}
      <div className="workspace-attachments__entry-selector">
        <label htmlFor="attachment-entry-select" className="workspace-attachments__entry-label">
          ربط بقيد <span aria-hidden="true">*</span>
        </label>
        {entries.length === 0 ? (
          <p className="workspace-attachments__no-entries">
            لا توجد قيود مرتبطة بهذا المشروع. أضف قيداً أولاً من تبويب القيود اليومية.
          </p>
        ) : (
          <select
            id="attachment-entry-select"
            className="workspace-attachments__entry-select"
            value={selectedEntryId}
            onChange={(e) => setSelectedEntryId(e.target.value)}
          >
            <option value="">— اختر القيد المرتبط بالملف —</option>
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                #{entry.seq ?? '—'} · {formatAccountingDate(entry.entryDate)} ·{' '}
                {entry.description || 'بدون بيان'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Hint ── */}
      <p className="workspace-attachments__hint">
        الأنواع المقبولة: JPEG، PNG، WEBP، PDF — الحد الأقصى: {formatBytes(MAX_FILE_SIZE_BYTES)}
      </p>

      {/* ── Upload error ── */}
      {uploadError && (
        <div className="workspace-attachments__error" role="alert">
          {uploadError}
        </div>
      )}

      {/* ── Cleanup warnings ── */}
      {cleanupWarnings.map((w) => (
        <CleanupWarningBanner
          key={w.attachmentId}
          warning={w}
          onDismiss={() => dismissWarning(w.attachmentId)}
        />
      ))}

      {/* ── List ── */}
      {isLoading ? (
        <div className="workspace-attachments__loading">
          <Loader2 size={24} className="spin" />
          <span>جارٍ تحميل المرفقات…</span>
        </div>
      ) : attachments.length === 0 ? (
        <div className="workspace-attachments__empty">
          <Paperclip size={34} />
          <strong>لا توجد مرفقات بعد</strong>
          <span>اختر قيداً ثم ارفع أول ملف باستخدام زر رفع ملف أعلاه.</span>
        </div>
      ) : (
        <div className="workspace-attachments__list">
          {attachments.map((att) => (
            <AttachmentRow
              key={att.id}
              attachment={att}
              projectId={projectId}
              onCleanupWarning={handleCleanupWarning}
            />
          ))}
        </div>
      )}
    </div>
  )
}

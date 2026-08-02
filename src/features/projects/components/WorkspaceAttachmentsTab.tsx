import { FileText, Image, Loader2, Paperclip, ShieldOff, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  useAttachmentSignedUrl,
  useDeleteAttachment,
  useProjectAttachments,
  useUploadAttachment,
} from '../hooks/useProjectAttachments'
import type { Attachment, AttachmentCleanupWarning } from '../types/project-attachment.types'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../types/project-attachment.types'

type Props = {
  projectId: string
  entryId: string | null // most-recent entry for upload target; null = no entry yet
}

const ACCEPT = ALLOWED_MIME_TYPES.join(',')

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={18} />
  return <FileText size={18} />
}

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
  const { remove, isDeleting } = useDeleteAttachment(projectId, onCleanupWarning)

  async function handleOpen() {
    const url = await getUrl({ storagePath: attachment.storagePath })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="attachment-row">
      <span className="attachment-row__icon">{fileIcon(attachment.mimeType)}</span>

      <button
        type="button"
        className="attachment-row__name"
        onClick={handleOpen}
        disabled={urlLoading}
        title="فتح الملف"
      >
        {urlLoading ? <Loader2 size={14} className="spin" /> : null}
        {attachment.fileName}
      </button>

      <span className="attachment-row__meta">{formatBytes(attachment.sizeBytes)}</span>

      <button
        type="button"
        className="attachment-row__delete"
        onClick={() => void remove(attachment.id)}
        disabled={isDeleting}
        aria-label={`حذف ${attachment.fileName}`}
        title="حذف المرفق"
      >
        {isDeleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  )
}

export function WorkspaceAttachmentsTab({ projectId, entryId }: Props) {
  const { attachments, isLoading, error } = useProjectAttachments(projectId)
  const { upload, isUploading, uploadError, reset } = useUploadAttachment(projectId)
  const [cleanupWarning, setCleanupWarning] = useState<AttachmentCleanupWarning | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Permission error (RLS returns empty + no insert right) ───────────────
  if (error && (error.includes('permission') || error.includes('RLS') || error.includes('policy'))) {
    return (
      <div className="workspace-attachments__permission">
        <ShieldOff size={36} />
        <strong>غير مصرح بعرض المرفقات</strong>
        <span>تحتاج صلاحية محاسب أو أعلى للوصول إلى هذا القسم.</span>
      </div>
    )
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !entryId) return
    reset()
    try {
      await upload({ projectId, entryId, file })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
            disabled={isUploading || !entryId}
            aria-label="رفع مرفق"
          />
          <label
            htmlFor="attachment-file-input"
            className={`workspace-attachments__upload-btn${!entryId || isUploading ? ' is-disabled' : ''}`}
            title={!entryId ? 'يجب إضافة قيد أولاً قبل رفع مرفق' : undefined}
            aria-disabled={!entryId || isUploading}
          >
            {isUploading ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
            {isUploading ? 'جارٍ الرفع…' : 'رفع ملف'}
          </label>
        </div>
      </div>

      {/* ── Upload hint ── */}
      <p className="workspace-attachments__hint">
        الأنواع المقبولة: JPEG، PNG، WEBP، PDF — الحد الأقصى للحجم: {formatBytes(MAX_FILE_SIZE_BYTES)}
      </p>

      {/* ── Upload error ── */}
      {uploadError && (
        <div className="workspace-attachments__error" role="alert">
          {uploadError}
        </div>
      )}

      {/* ── Cleanup warning ── */}
      {cleanupWarning && (
        <div className="workspace-attachments__warning" role="alert">
          تم حذف السجل لكن الملف قد لا يكون محذوفاً من التخزين. يمكن المحاولة مجدداً.
          <button type="button" onClick={() => setCleanupWarning(null)}>
            إغلاق
          </button>
        </div>
      )}

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
          <span>ارفع أول ملف باستخدام زر رفع ملف أعلاه.</span>
        </div>
      ) : (
        <div className="workspace-attachments__list">
          {attachments.map((att) => (
            <AttachmentRow
              key={att.id}
              attachment={att}
              projectId={projectId}
              onCleanupWarning={setCleanupWarning}
            />
          ))}
        </div>
      )}
    </div>
  )
}

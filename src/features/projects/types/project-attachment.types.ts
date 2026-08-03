// ─── Raw DB record (repository boundary — must not reach UI) ──────────────────

export type AttachmentRecord = {
  id: string
  entry_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  sort_order: number
  created_by: string | null
  created_at: string
}

// ─── Domain model (service → hook → component) ───────────────────────────────

export type Attachment = {
  id: string
  entryId: string
  storagePath: string
  fileName: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
  sizeBytes: number
  sortOrder: number
  createdBy: string | null
  createdAt: string
}

// ─── Upload input ─────────────────────────────────────────────────────────────

export type AttachmentUploadInput = {
  projectId: string
  entryId: string
  file: File
}

// ─── Result types ─────────────────────────────────────────────────────────────

/**
 * Returned when the DB record was deleted but the Storage object removal
 * failed. The file is now orphaned — the caller can retry cleanup.
 */
export type AttachmentCleanupWarning = {
  kind: 'cleanup_warning'
  attachmentId: string
  storagePath: string
  reason: string
}

export type DeleteAttachmentResult = { kind: 'success' } | AttachmentCleanupWarning

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/** Result of retrying a failed Storage cleanup after delete. */
export type RetryCleanupResult = { kind: 'success' } | { kind: 'failed'; reason: string }

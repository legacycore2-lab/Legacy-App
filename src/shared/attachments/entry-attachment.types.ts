export type EntryAttachmentRecord = {
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

export type EntryAttachment = {
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

export type EntryAttachmentCleanupWarning = {
  kind: 'cleanup_warning'
  attachmentId: string
  storagePath: string
  reason: string
}

export type DeleteEntryAttachmentResult = { kind: 'success' } | EntryAttachmentCleanupWarning

export type RetryEntryAttachmentCleanupResult =
  | { kind: 'success' }
  | { kind: 'failed'; reason: string }

export const ENTRY_ATTACHMENT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

export const ENTRY_ATTACHMENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

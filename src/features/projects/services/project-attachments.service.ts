import { AppError } from '../../../shared/errors/app-error'
import {
  createSignedUrl,
  deleteAttachmentRecord,
  findAttachmentById,
  findAttachmentsByProjectId,
  insertAttachmentRecord,
  removeFileFromStorage,
  uploadFileToStorage,
} from '../repositories/project-attachments.repository'
import type {
  Attachment,
  AttachmentRecord,
  AttachmentUploadInput,
  DeleteAttachmentResult,
} from '../types/project-attachment.types'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../types/project-attachment.types'

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toAttachment(record: AttachmentRecord): Attachment {
  return {
    id: record.id,
    entryId: record.entry_id,
    storagePath: record.storage_path,
    fileName: record.file_name,
    mimeType: record.mime_type as Attachment['mimeType'],
    sizeBytes: record.size_bytes,
    sortOrder: record.sort_order,
    createdBy: record.created_by,
    createdAt: record.created_at,
  }
}

// ─── Safe filename generation ─────────────────────────────────────────────────

/**
 * Generates a unique, path-safe storage filename.
 * Format: entries/{entryId}/{timestamp}-{randomHex}.{ext}
 * Satisfies the storage_path constraint: starts with 'entries/' and no '..'.
 */
function buildStoragePath(entryId: string, originalName: string): string {
  const ext =
    originalName
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') ?? 'bin'
  const timestamp = Date.now()
  const rand = Math.random().toString(16).slice(2, 10)
  return `entries/${entryId}/${timestamp}-${rand}.${ext}`
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateUploadInput(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as Attachment['mimeType'])) {
    throw new AppError(`نوع الملف غير مسموح به. الأنواع المقبولة: JPEG، PNG، WEBP، PDF.`, 'INVALID_MIME_TYPE')
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(`حجم الملف يتجاوز الحد المسموح به (10 ميغابايت).`, 'FILE_TOO_LARGE')
  }

  if (!file.name || file.name.trim().length === 0) {
    throw new AppError(`اسم الملف غير صالح.`, 'INVALID_FILE_NAME')
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listProjectAttachments(projectId: string): Promise<Attachment[]> {
  const records = await findAttachmentsByProjectId(projectId)
  return records.map(toAttachment)
}

/**
 * Upload workflow:
 * 1. Validate MIME type, size, name (throws on failure — no storage touched)
 * 2. Generate safe, unique storage path
 * 3. Upload file to Storage
 * 4. Insert DB record
 * 5. If DB insert fails → compensating rollback: remove file from Storage
 */
export async function uploadAttachment(input: AttachmentUploadInput): Promise<Attachment> {
  const { entryId, file } = input

  // Step 1 — validate before touching storage
  validateUploadInput(file)

  // Step 2 — build safe path
  const storagePath = buildStoragePath(entryId, file.name)

  // Step 3 — upload to storage
  await uploadFileToStorage(storagePath, file)

  // Step 4 — insert DB record
  try {
    const record = await insertAttachmentRecord({
      entry_id: entryId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      sort_order: 0,
    })
    return toAttachment(record)
  } catch (dbError) {
    // Step 5 — compensating rollback: remove orphan file from storage
    try {
      await removeFileFromStorage(storagePath)
    } catch {
      // Rollback failed — log but throw the original DB error
      console.error('Attachment rollback failed — orphan file at:', storagePath)
    }
    throw dbError
  }
}

/**
 * Delete workflow (DB-first, then Storage):
 * 1. Fetch the record to get storage_path
 * 2. Delete the DB record
 * 3. Delete the Storage object
 * 4. If Storage delete fails → return CleanupWarning (DB record is gone,
 *    file is orphaned but no broken reference remains in DB)
 *
 * Order rationale: deleting DB first means no DB record will ever point to
 * a missing file. The inverse (Storage first) risks a broken reference if
 * the DB delete fails.
 */
export async function deleteAttachment(attachmentId: string): Promise<DeleteAttachmentResult> {
  // Step 1 — fetch record
  const record = await findAttachmentById(attachmentId)
  if (!record) {
    throw new AppError('المرفق غير موجود.', 'ATTACHMENT_NOT_FOUND')
  }

  const { storage_path: storagePath } = record

  // Step 2 — delete DB record
  await deleteAttachmentRecord(attachmentId)

  // Step 3 — delete storage object
  try {
    await removeFileFromStorage(storagePath)
    return { kind: 'success' }
  } catch (storageError) {
    // Step 4 — DB gone but storage failed → return cleanup warning
    return {
      kind: 'cleanup_warning',
      attachmentId,
      storagePath,
      reason: storageError instanceof Error ? storageError.message : 'Storage removal failed.',
    }
  }
}

/**
 * Generates a signed URL on demand (call only when user opens a file).
 * Default expiry: 60 seconds.
 */
export async function getAttachmentSignedUrl(storagePath: string, expiresInSeconds = 60): Promise<string> {
  return createSignedUrl(storagePath, expiresInSeconds)
}

/**
 * Retries removing an orphaned Storage file after a previous cleanup failure.
 * Call this when the user taps "إعادة المحاولة" on a CleanupWarning.
 */
export async function retryStorageCleanup(
  storagePath: string,
): Promise<import('../types/project-attachment.types').RetryCleanupResult> {
  try {
    await removeFileFromStorage(storagePath)
    return { kind: 'success' }
  } catch (err) {
    return {
      kind: 'failed',
      reason: err instanceof Error ? err.message : 'Storage removal failed.',
    }
  }
}

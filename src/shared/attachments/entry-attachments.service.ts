import { AppError } from '../errors/app-error'
import type {
  DeleteEntryAttachmentResult,
  EntryAttachment,
  EntryAttachmentRecord,
  RetryEntryAttachmentCleanupResult,
} from './entry-attachment.types'
import {
  ENTRY_ATTACHMENT_ALLOWED_MIME_TYPES,
  ENTRY_ATTACHMENT_MAX_FILE_SIZE_BYTES,
} from './entry-attachment.types'
import {
  createEntryAttachmentSignedUrl,
  deleteEntryAttachmentRecord,
  findEntryAttachmentById,
  findEntryAttachments,
  insertEntryAttachmentRecord,
  removeEntryAttachmentFile,
  uploadEntryAttachmentFile,
} from './entry-attachments.repository'

function toEntryAttachment(record: EntryAttachmentRecord): EntryAttachment {
  return {
    id: record.id,
    entryId: record.entry_id,
    storagePath: record.storage_path,
    fileName: record.file_name,
    mimeType: record.mime_type as EntryAttachment['mimeType'],
    sizeBytes: record.size_bytes,
    sortOrder: record.sort_order,
    createdBy: record.created_by,
    createdAt: record.created_at,
  }
}

function buildStoragePath(entryId: string, originalName: string): string {
  const ext =
    originalName
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') ?? 'bin'
  const timestamp = Date.now()
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  return `entries/${entryId}/${timestamp}-${rand}.${ext}`
}

function validateUploadFile(file: File): void {
  if (!ENTRY_ATTACHMENT_ALLOWED_MIME_TYPES.includes(file.type as EntryAttachment['mimeType'])) {
    throw new AppError(
      'نوع الملف غير مسموح به. الأنواع المقبولة: JPEG، PNG، WEBP، PDF.',
      'INVALID_MIME_TYPE',
    )
  }
  if (file.size > ENTRY_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    throw new AppError('حجم الملف يتجاوز الحد المسموح به (10 ميغابايت).', 'FILE_TOO_LARGE')
  }
  if (!file.name.trim()) {
    throw new AppError('اسم الملف غير صالح.', 'INVALID_FILE_NAME')
  }
}

export async function listEntryAttachments(entryId: string): Promise<EntryAttachment[]> {
  if (!entryId) return []
  const records = await findEntryAttachments(entryId)
  return records.map(toEntryAttachment)
}

export async function uploadEntryAttachment(entryId: string, file: File): Promise<EntryAttachment> {
  if (!entryId) throw new AppError('معرّف القيد مطلوب.', 'ENTRY_ID_REQUIRED')
  validateUploadFile(file)

  const storagePath = buildStoragePath(entryId, file.name)
  await uploadEntryAttachmentFile(storagePath, file)

  try {
    const record = await insertEntryAttachmentRecord({
      entry_id: entryId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      sort_order: 0,
    })
    return toEntryAttachment(record)
  } catch (dbError) {
    try {
      await removeEntryAttachmentFile(storagePath)
    } catch {
      console.error('Attachment rollback failed — orphan file at:', storagePath)
    }
    throw dbError
  }
}

export async function deleteEntryAttachment(id: string): Promise<DeleteEntryAttachmentResult> {
  const record = await findEntryAttachmentById(id)
  if (!record) throw new AppError('المرفق غير موجود.', 'ATTACHMENT_NOT_FOUND')

  await deleteEntryAttachmentRecord(id)

  try {
    await removeEntryAttachmentFile(record.storage_path)
    return { kind: 'success' }
  } catch (error) {
    return {
      kind: 'cleanup_warning',
      attachmentId: id,
      storagePath: record.storage_path,
      reason: error instanceof Error ? error.message : 'Storage removal failed.',
    }
  }
}

export async function getEntryAttachmentUrl(storagePath: string): Promise<string> {
  if (!storagePath) throw new AppError('مسار الملف غير صالح.', 'INVALID_STORAGE_PATH')
  return createEntryAttachmentSignedUrl(storagePath, 60)
}

export async function retryEntryAttachmentCleanup(
  storagePath: string,
): Promise<RetryEntryAttachmentCleanupResult> {
  try {
    await removeEntryAttachmentFile(storagePath)
    return { kind: 'success' }
  } catch (error) {
    return {
      kind: 'failed',
      reason: error instanceof Error ? error.message : 'Storage removal failed.',
    }
  }
}

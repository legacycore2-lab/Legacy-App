import { getSupabaseClient } from '../../../lib/supabase/client'
import type { AttachmentRecord } from '../types/project-attachment.types'

const BUCKET = 'entry-attachments'

const ATTACHMENT_FIELDS = [
  'id',
  'entry_id',
  'storage_path',
  'file_name',
  'mime_type',
  'size_bytes',
  'sort_order',
  'created_by',
  'created_at',
].join(', ')

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all attachments for a project by joining through entries.project_id.
 * No extra SQL needed — PostgREST resolves the FK chain.
 */
export async function findAttachmentsByProjectId(projectId: string): Promise<AttachmentRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entry_attachments')
    .select(`${ATTACHMENT_FIELDS}, entries!inner(project_id)`)
    .eq('entries.project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as AttachmentRecord[]
}

export async function findAttachmentById(id: string): Promise<AttachmentRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('entry_attachments')
    .select(ATTACHMENT_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as unknown as AttachmentRecord | null
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Uploads a file to Storage.
 * storagePath must follow the pattern: entries/{entryId}/{safeFilename}
 */
export async function uploadFileToStorage(storagePath: string, file: File): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) throw error
}

/**
 * Removes a file from Storage.
 * Returns false if the object was not found (already gone).
 */
export async function removeFileFromStorage(storagePath: string): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(BUCKET).remove([storagePath])

  if (error) throw error
}

/**
 * Inserts an attachment DB record.
 * storagePath, fileName, mimeType, sizeBytes must already be validated.
 */
export async function insertAttachmentRecord(payload: {
  entry_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  sort_order: number
}): Promise<AttachmentRecord> {
  const { data, error } = await getSupabaseClient()
    .from('entry_attachments')
    .insert(payload)
    .select(ATTACHMENT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Supabase did not return the created attachment.')
  return data as unknown as AttachmentRecord
}

/**
 * Deletes an attachment DB record by id.
 */
export async function deleteAttachmentRecord(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('entry_attachments').delete().eq('id', id)

  if (error) throw error
}

/**
 * Generates a short-lived signed URL for a single attachment.
 * Call on-demand (when the user opens the file), NOT for the full list.
 */
export async function createSignedUrl(storagePath: string, expiresInSeconds = 60): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .storage.from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error) throw error
  if (!data?.signedUrl) throw new Error('Signed URL generation returned no URL.')
  return data.signedUrl
}

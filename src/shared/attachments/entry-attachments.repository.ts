import { getSupabaseClient } from '../../lib/supabase/client'
import type { EntryAttachmentRecord } from './entry-attachment.types'

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

export async function findEntryAttachments(entryId: string): Promise<EntryAttachmentRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entry_attachments')
    .select(ATTACHMENT_FIELDS)
    .eq('entry_id', entryId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as EntryAttachmentRecord[]
}

export async function findEntryAttachmentById(id: string): Promise<EntryAttachmentRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('entry_attachments')
    .select(ATTACHMENT_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as unknown as EntryAttachmentRecord | null
}

export async function uploadEntryAttachmentFile(storagePath: string, file: File): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) throw error
}

export async function removeEntryAttachmentFile(storagePath: string): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}

export async function insertEntryAttachmentRecord(payload: {
  entry_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  sort_order: number
}): Promise<EntryAttachmentRecord> {
  const { data, error } = await getSupabaseClient()
    .from('entry_attachments')
    .insert(payload)
    .select(ATTACHMENT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Supabase did not return the created attachment.')
  return data as unknown as EntryAttachmentRecord
}

export async function deleteEntryAttachmentRecord(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('entry_attachments').delete().eq('id', id)
  if (error) throw error
}

export async function createEntryAttachmentSignedUrl(
  storagePath: string,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .storage.from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error) throw error
  if (!data?.signedUrl) throw new Error('Signed URL generation returned no URL.')
  return data.signedUrl
}

import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import { createSignedUrl } from './project-attachments.repository'
import type {
  ActivityAttachmentRecord,
  ActivityEntryRecord,
  ActivityProjectRecord,
} from '../types/project-activity.types'

/** Fetches project metadata needed for created/updated events. */
export async function findActivityProject(projectId: string): Promise<ActivityProjectRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, created_at, updated_at')
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw error
  return data as ActivityProjectRecord | null
}

/**
 * Fetches all entries for a project, paginated with stable ordering.
 * entry_number ASC ensures consistent pages; oldest-first for timeline display.
 */
export async function findActivityEntries(projectId: string): Promise<ActivityEntryRecord[]> {
  return fetchAllWithPagination<ActivityEntryRecord>((client, from, to) =>
    client
      .from('entries')
      .select('id, entry_number, entry_type, amount, description, entry_date, project_id')
      .eq('project_id', projectId)
      .order('entry_number', { ascending: true })
      .range(from, to),
  )
}

/** Fetches all attachments for a project via entries FK chain. */
export async function findActivityAttachments(projectId: string): Promise<ActivityAttachmentRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entry_attachments')
    .select('id, entry_id, file_name, storage_path, created_at, entries!inner(project_id)')
    .eq('entries.project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ActivityAttachmentRecord[]
}

/** On-demand signed URL for an attachment — 60 s expiry. */
export async function getActivityAttachmentUrl(storagePath: string): Promise<string> {
  return createSignedUrl(storagePath, 60)
}

import { getSupabaseClient } from '../../../lib/supabase/client'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import type { ProjectInsertRecord, ProjectRecord } from '../types/project.types'

const PROJECT_FIELDS = [
  'id',
  'name',
  'code',
  'client_name',
  'location',
  'manager',
  'status',
  'progress',
  'contract_value',
  'received',
  'spent',
  'start_date',
  'end_date',
  'notes',
  'is_archived',
  'created_at',
  'updated_at',
  'created_by',
].join(', ')

export async function findProjects(): Promise<ProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select(PROJECT_FIELDS)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []) as ProjectRow[] as unknown as ProjectRecord[]
}

export async function insertProject(record: ProjectInsertRecord): Promise<ProjectRecord> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .insert(record)
    .select(PROJECT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Supabase did not return the created project.')

  return data as ProjectRow as unknown as ProjectRecord
}

export async function updateProject(id: string, record: ProjectInsertRecord): Promise<ProjectRecord> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .update(record)
    .eq('id', id)
    .select(PROJECT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Supabase did not return the updated project.')

  return data as ProjectRow as unknown as ProjectRecord
}

export function subscribeToProjectChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('projects', ['projects'], onChange)
}

export type ProjectEntryRecord = {
  id: string
  seq: number | null
  entry_date: string
  entry_type: string
  category: string | null
  description: string | null
  contractor_name: string | null
  payment_method: string | null
  amount: number
}

export async function findProjectById(id: string): Promise<ProjectRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select(PROJECT_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as ProjectRow | null as unknown as ProjectRecord | null
}

export async function findProjectEntries(projectId: string): Promise<ProjectEntryRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select(
      'id, seq:entry_number, entry_date, entry_type, category, description, contractor_name, payment_method, amount',
    )
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })

  if (error) throw error
  return (data ?? []) as ProjectEntryRecord[]
}

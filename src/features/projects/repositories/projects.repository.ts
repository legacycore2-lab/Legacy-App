import { getSupabaseClient } from '../../../lib/supabase/client'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
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

/**
 * Fetches all projects with their real financial totals aggregated from
 * the entries table. The static `received`/`spent` columns on the projects
 * table are not automatically updated when entries are added, so we compute
 * income and expense totals on the fly by joining entries.
 *
 * Pattern: fetch projects + entries in two parallel queries, then merge
 * in the service layer — no new SQL / RLS / migrations required.
 */
export async function findProjects(): Promise<ProjectRecord[]> {
  const supabase = getSupabaseClient()

  const [projectsResult, entriesResult] = await Promise.all([
    supabase.from('projects').select(PROJECT_FIELDS).order('name', { ascending: true }),
    supabase.from('entries').select('project_id, entry_type, amount').not('project_id', 'is', null),
  ])

  if (projectsResult.error) throw projectsResult.error
  if (entriesResult.error) throw entriesResult.error

  // Aggregate income + expense per project from entries
  const incomeByProject = new Map<string, number>()
  const expenseByProject = new Map<string, number>()

  for (const entry of entriesResult.data ?? []) {
    if (!entry.project_id) continue
    const amount = Number(entry.amount)
    if (!Number.isFinite(amount) || amount < 0) continue

    if (entry.entry_type === 'income' || entry.entry_type === 'i') {
      incomeByProject.set(entry.project_id, (incomeByProject.get(entry.project_id) ?? 0) + amount)
    } else if (entry.entry_type === 'expense' || entry.entry_type === 'e') {
      expenseByProject.set(entry.project_id, (expenseByProject.get(entry.project_id) ?? 0) + amount)
    }
  }

  // Merge computed totals into each project record, overriding static columns
  return (projectsResult.data ?? []).map((raw) => {
    const project = raw as unknown as ProjectRecord
    return {
      ...project,
      received: incomeByProject.get(project.id) ?? project.received ?? 0,
      spent: expenseByProject.get(project.id) ?? project.spent ?? 0,
    }
  })
}

export async function insertProject(record: ProjectInsertRecord): Promise<ProjectRecord> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .insert(record)
    .select(PROJECT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Supabase did not return the created project.')

  return data as unknown as ProjectRecord
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

  return data as unknown as ProjectRecord
}

export async function countProjectEntries(projectId: string): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (error) throw error
  return count ?? 0
}

export async function deleteProjectById(projectId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('projects').delete().eq('id', projectId)
  if (error) throw error
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
  amount: number | string
}

export async function findProjectById(id: string): Promise<ProjectRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select(PROJECT_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as unknown as ProjectRecord | null
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
  return (data ?? []) as unknown as ProjectEntryRecord[]
}

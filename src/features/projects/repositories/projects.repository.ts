import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import type { ProjectInsertRecord, ProjectRecord, ProjectStatusFilter } from '../types/project.types'

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

function normalizeProjectSearch(value: string): string {
  return value
    .replace(/[(),%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function findProjects(): Promise<ProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select(PROJECT_FIELDS)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ProjectRecord[]
}

export async function findProjectsPage(input: {
  offset: number
  limit: number
  query: string
  status: ProjectStatusFilter
}): Promise<{ records: ProjectRecord[]; totalCount: number }> {
  let request = getSupabaseClient()
    .from('projects')
    .select(PROJECT_FIELDS, { count: 'exact' })
    .order('name', { ascending: true })
    .range(input.offset, input.offset + input.limit - 1)

  if (input.status === 'archived') {
    request = request.eq('is_archived', true)
  } else if (input.status !== 'all') {
    request = request.eq('is_archived', false).eq('status', input.status)
  }

  const search = normalizeProjectSearch(input.query)
  if (search) {
    const pattern = `%${search}%`
    request = request.or(
      `name.ilike.${pattern},code.ilike.${pattern},client_name.ilike.${pattern},location.ilike.${pattern},manager.ilike.${pattern}`,
    )
  }

  const { data, error, count } = await request
  if (error) throw error

  return {
    records: (data ?? []) as unknown as ProjectRecord[],
    totalCount: count ?? 0,
  }
}

export type FinancialEntryRow = {
  project_id: string
  entry_type: string | null
  amount: number | string | null
  entry_number: number | null
}

export async function findAllProjectFinancialEntries(): Promise<FinancialEntryRow[]> {
  return fetchAllWithPagination<FinancialEntryRow>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select('project_id, entry_type, amount, entry_number')
      .not('project_id', 'is', null)
      .order('entry_number', { ascending: true })
      .range(from, to),
  )
}

export async function findProjectFinancialEntries(projectIds: string[]): Promise<FinancialEntryRow[]> {
  if (projectIds.length === 0) return []

  return fetchAllWithPagination<FinancialEntryRow>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select('project_id, entry_type, amount, entry_number')
      .in('project_id', projectIds)
      .order('entry_number', { ascending: true })
      .range(from, to),
  )
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

export type ProjectDeleteDependencies = {
  entries: number
  journals: number
  journalLines: number
  advanceProjects: number
  advanceTransactions: number
}

async function countRowsByProject(table: string, projectId: string): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
  if (error) throw error
  return count ?? 0
}

export async function countProjectDeleteDependencies(projectId: string): Promise<ProjectDeleteDependencies> {
  const [entries, journals, journalLines, advanceProjects, advanceTransactions] = await Promise.all([
    countRowsByProject('entries', projectId),
    countRowsByProject('journals', projectId),
    countRowsByProject('journal_lines', projectId),
    countRowsByProject('advance_projects', projectId),
    countRowsByProject('advance_transactions', projectId),
  ])
  return { entries, journals, journalLines, advanceProjects, advanceTransactions }
}

export async function deleteProjectById(projectId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function archiveProjectById(projectId: string): Promise<ProjectRecord> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .update({ is_archived: true, status: 'archived' })
    .eq('id', projectId)
    .select(PROJECT_FIELDS)
    .single()
  if (error) throw error
  if (!data) throw new Error('Supabase did not return the archived project.')
  return data as unknown as ProjectRecord
}

export function subscribeToProjectChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('projects', ['projects'], onChange)
}

export type ProjectEntryRecord = {
  id: string
  seq: number | null
  entry_date: string
  entry_type: string | null
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
  return fetchAllWithPagination<ProjectEntryRecord>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select(
        'id, seq:entry_number, entry_date, entry_type, category, description, contractor_name, payment_method, amount',
      )
      .eq('project_id', projectId)
      .order('entry_number', { ascending: true })
      .range(from, to),
  )
}

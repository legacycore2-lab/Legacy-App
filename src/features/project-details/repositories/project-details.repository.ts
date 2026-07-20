import { getSupabaseClient } from '../../../lib/supabase/client'

export type ProjectDetailsRecord = {
  id: string
  name: string
  start_date: string | null
  close_date: string | null
  is_archived: boolean | null
}

export type ProjectEntryRecord = {
  id: string
  seq: number | null
  entry_date: string
  type: string
  category: string | null
  description: string | null
  contractor: string | null
  payment_method: string | null
  amount: number | string
  project: { name: string } | { name: string }[] | null
}

export type ProjectEntriesQuery = {
  projectId: string
  offset: number
  limit: number
  query: string
  type: 'all' | 'income' | 'expense'
}

function normalizeSearch(value: string): string {
  return value
    .replace(/[(),%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function findProjectDetails(projectId: string): Promise<ProjectDetailsRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, start_date, close_date, is_archived')
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw error
  return data as ProjectDetailsRecord | null
}

export async function findProjectEntries(query: ProjectEntriesQuery) {
  let request = getSupabaseClient()
    .from('entries')
    .select(
      `id, seq:entry_number, entry_date, type:entry_type, category, description,
       contractor:contractor_name, payment_method, amount, project:projects(name)`,
      { count: 'exact' },
    )
    .eq('project_id', query.projectId)
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })
    .range(query.offset, query.offset + query.limit - 1)

  if (query.type !== 'all') request = request.eq('entry_type', query.type)

  const search = normalizeSearch(query.query)
  if (search) {
    const pattern = `%${search}%`
    request = request.or(
      `description.ilike.${pattern},category.ilike.${pattern},contractor_name.ilike.${pattern},payment_method.ilike.${pattern},entry_code.ilike.${pattern}`,
    )
  }

  const { data, error, count } = await request
  if (error) throw error

  return {
    records: (data ?? []) as ProjectEntryRecord[],
    totalCount: count ?? 0,
  }
}

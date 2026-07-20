import { getSupabaseClient } from '../../../lib/supabase/client'

export type JournalEntryRecord = {
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

export type JournalEntriesQuery = {
  offset: number
  limit: number
  query: string
  type: 'all' | 'income' | 'expense'
  projectId?: string
}

export type JournalEntriesResult = {
  records: JournalEntryRecord[]
  totalCount: number
}

function normalizeSearch(value: string): string {
  return value
    .replace(/[(),%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function findJournalEntries(
  query: JournalEntriesQuery,
): Promise<JournalEntriesResult> {
  let request = getSupabaseClient()
    .from('entries')
    .select(
      `
      id,
      seq:entry_number,
      entry_date,
      type:entry_type,
      category,
      description,
      contractor:contractor_name,
      payment_method,
      amount,
        project:projects(name)
      `,
      { count: 'exact' },
    )
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })
    .range(query.offset, query.offset + query.limit - 1)

  if (query.projectId) request = request.eq('project_id', query.projectId)
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
    records: (data ?? []) as JournalEntryRecord[],
    totalCount: count ?? 0,
  }
}

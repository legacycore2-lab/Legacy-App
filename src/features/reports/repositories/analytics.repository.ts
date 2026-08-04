import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import type { JournalAnalyticsEntryRecord, ReportProjectRecord } from '../types'

export type { ReportProjectRecord }

export async function findAnalyticsProjects(): Promise<ReportProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, code, client_name, status, progress, contract_value, is_archived')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ReportProjectRecord[]
}

export async function findAnalyticsEntries(
  dateFrom?: string,
  dateTo?: string,
  projectId?: string,
): Promise<JournalAnalyticsEntryRecord[]> {
  return fetchAllWithPagination<JournalAnalyticsEntryRecord>((from, to) => {
    let q = getSupabaseClient()
      .from('entries')
      .select(
        `id, entry_number, entry_date, entry_type, category, description,
         contractor_name, payment_method, amount, project_id,
         project:projects(name)`,
      )
      .not('project_id', 'is', null)
      .order('entry_date', { ascending: false })
      .order('entry_number', { ascending: false })
      .range(from, to)

    if (dateFrom) q = q.gte('entry_date', dateFrom)
    if (dateTo) q = q.lte('entry_date', dateTo)
    if (projectId) q = q.eq('project_id', projectId)

    return q
  })
}

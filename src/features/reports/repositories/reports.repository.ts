import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import type { ReportEntryRecord, ReportProjectRecord } from '../types/report.types'

export async function findReportProjects(): Promise<ReportProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, code, client_name, status, progress, contract_value, is_archived')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ReportProjectRecord[]
}

export async function findReportEntries(): Promise<ReportEntryRecord[]> {
  return fetchAllWithPagination<ReportEntryRecord>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select('project_id, entry_type, amount, entry_number')
      .not('project_id', 'is', null)
      .order('entry_number', { ascending: true })
      .range(from, to),
  )
}

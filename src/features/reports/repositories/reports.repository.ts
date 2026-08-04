import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import type { ReportEntryRecord, ReportJournalEntryRecord, ReportProjectRecord } from '../types/report.types'

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
      .select('project_id, entry_date, entry_type, amount, entry_number')
      .not('project_id', 'is', null)
      .order('entry_date', { ascending: false })
      .order('entry_number', { ascending: false })
      .range(from, to),
  )
}

export async function findReportJournalEntries(): Promise<ReportJournalEntryRecord[]> {
  return fetchAllWithPagination<ReportJournalEntryRecord>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select(
        `id,
         entry_date,
         entry_type,
         amount,
         entry_number,
         contractor_name,
         payment_method,
         description,
         project_id,
         project:projects(name)`,
      )
      .order('entry_date', { ascending: false })
      .order('entry_number', { ascending: false })
      .range(from, to),
  )
}

import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import type { ContractorReportEntryRecord } from '../types/contractor-reports.types'
import type { ProfitLossEntryRecord } from '../types/profit-loss.types'
import type { ReportJournalEntryRecord, ReportProjectRecord } from '../types/report.types'

export async function findReportProjects(): Promise<ReportProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, code, client_name, status, progress, contract_value, is_archived')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ReportProjectRecord[]
}

type ReversalJournalRow = {
  source_id: string | null
}

type ReversalAwareEntry = {
  id?: string
  amount: number | string | null
}

async function findReversalEntryIds(): Promise<Set<string>> {
  const rows = await fetchAllWithPagination<ReversalJournalRow>((from, to) =>
    getSupabaseClient()
      .from('journals')
      .select('source_id')
      .eq('source_type', 'single_line_entry')
      .not('reversal_of', 'is', null)
      .not('source_id', 'is', null)
      .order('id', { ascending: true })
      .range(from, to),
  )

  return new Set(rows.flatMap((row) => (row.source_id ? [row.source_id] : [])))
}

export function applyReportReversalSigns<T extends ReversalAwareEntry>(
  rows: T[],
  reversalEntryIds: Set<string>,
): T[] {
  return rows.map((row) => {
    if (!row.id || !reversalEntryIds.has(row.id)) return row
    const amount = Number(row.amount)
    if (!Number.isFinite(amount)) return row
    return { ...row, amount: -Math.abs(amount) }
  })
}

export async function findReportEntries(): Promise<ProfitLossEntryRecord[]> {
  const [rows, reversalEntryIds] = await Promise.all([
    fetchAllWithPagination<ProfitLossEntryRecord>((from, to) =>
      getSupabaseClient()
        .from('entries')
        .select('id, project_id, entry_date, entry_type, amount, entry_number')
        .not('project_id', 'is', null)
        .order('entry_date', { ascending: false })
        .order('entry_number', { ascending: false })
        .range(from, to),
    ),
    findReversalEntryIds(),
  ])

  return applyReportReversalSigns(rows, reversalEntryIds)
}

export async function findReportJournalEntries(): Promise<ReportJournalEntryRecord[]> {
  const [rows, reversalEntryIds] = await Promise.all([
    fetchAllWithPagination<ReportJournalEntryRecord>((from, to) =>
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
    ),
    findReversalEntryIds(),
  ])

  return applyReportReversalSigns(rows, reversalEntryIds)
}

export async function findContractorReportEntries(): Promise<ContractorReportEntryRecord[]> {
  const [rows, reversalEntryIds] = await Promise.all([
    fetchAllWithPagination<ContractorReportEntryRecord>((from, to) =>
      getSupabaseClient()
        .from('entries')
        .select(
          `id,
           entry_number,
           entry_date,
           entry_type,
           amount,
           contractor_name,
           category,
           description,
           payment_method,
           project_id,
           project:projects(name)`,
        )
        .order('entry_date', { ascending: false })
        .order('entry_number', { ascending: false })
        .range(from, to),
    ),
    findReversalEntryIds(),
  ])

  return applyReportReversalSigns(rows, reversalEntryIds)
}

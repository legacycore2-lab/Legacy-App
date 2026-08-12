import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import type {
  DashboardFinancialEntryRecord,
  DashboardProjectRecord,
  DashboardRecentEntryRecord,
  DashboardSourceData,
} from '../types/dashboard.types'

const DASHBOARD_PROJECT_FIELDS = [
  'id',
  'name',
  'client_name',
  'status',
  'progress',
  'is_archived',
  'created_at',
].join(', ')

const DASHBOARD_FINANCIAL_ENTRY_FIELDS = ['project_id', 'type:entry_type', 'amount', 'seq:entry_number'].join(
  ', ',
)

const DASHBOARD_RECENT_ENTRY_FIELDS = [
  'id',
  'project_id',
  'type:entry_type',
  'amount',
  'description',
  'entry_date',
  'seq:entry_number',
].join(', ')

async function findProjects(): Promise<DashboardProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select(DASHBOARD_PROJECT_FIELDS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as DashboardProjectRecord[]
}

async function findFinancialEntries(): Promise<DashboardFinancialEntryRecord[]> {
  return fetchAllWithPagination<DashboardFinancialEntryRecord>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select(DASHBOARD_FINANCIAL_ENTRY_FIELDS)
      .order('entry_number', { ascending: false })
      .range(from, to),
  )
}

async function findRecentEntries(): Promise<DashboardRecentEntryRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select(DASHBOARD_RECENT_ENTRY_FIELDS)
    .order('entry_number', { ascending: false })
    .limit(3)

  if (error) throw error
  return (data ?? []) as unknown as DashboardRecentEntryRecord[]
}

export async function findDashboardData(): Promise<DashboardSourceData> {
  const [projects, financialEntries, recentEntries] = await Promise.all([
    findProjects(),
    findFinancialEntries(),
    findRecentEntries(),
  ])

  return { projects, financialEntries, recentEntries }
}

export function subscribeToDashboardChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('dashboard', ['projects', 'entries'], onChange)
}

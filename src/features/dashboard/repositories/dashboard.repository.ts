import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import type {
  DashboardEntryRecord,
  DashboardProjectRecord,
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

const DASHBOARD_ENTRY_FIELDS = [
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
    // Most-recently created projects first so the dashboard "latest projects" widget
    // shows the newest additions rather than the alphabetically-first names.
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as unknown as DashboardProjectRecord[]
}

async function findEntries(): Promise<DashboardEntryRecord[]> {
  // Paginated to avoid Supabase 1000-row default cap.
  // Descending entry_number ensures the most-recent entries appear first; this
  // allows the dashboard widget to slice the first 3 records correctly.
  return fetchAllWithPagination<DashboardEntryRecord>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select(DASHBOARD_ENTRY_FIELDS)
      .order('entry_number', { ascending: false })
      .range(from, to),
  )
}

export async function findDashboardData(): Promise<DashboardSourceData> {
  const [projects, entries] = await Promise.all([findProjects(), findEntries()])

  return { projects, entries }
}

export function subscribeToDashboardChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('dashboard', ['projects', 'entries'], onChange)
}

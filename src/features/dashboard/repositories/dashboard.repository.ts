import { getSupabaseClient } from '../../../lib/supabase/client'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import type {
  DashboardEntryRecord,
  DashboardProjectRecord,
  DashboardSourceData,
} from '../types/dashboard.types'

const DASHBOARD_PROJECT_FIELDS = ['id', 'name', 'client_name', 'status', 'progress', 'is_archived'].join(', ')

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
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []) as unknown as DashboardProjectRecord[]
}

async function findEntries(): Promise<DashboardEntryRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select(DASHBOARD_ENTRY_FIELDS)
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })

  if (error) throw error

  return (data ?? []) as unknown as DashboardEntryRecord[]
}

export async function findDashboardData(): Promise<DashboardSourceData> {
  const [projects, entries] = await Promise.all([findProjects(), findEntries()])

  return { projects, entries }
}

export function subscribeToDashboardChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('dashboard', ['projects', 'entries'], onChange)
}

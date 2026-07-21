import { getSupabaseClient } from '../../../lib/supabase/client'
import type {
  DashboardEntryRecord,
  DashboardProjectRecord,
  DashboardSourceData,
} from '../types/dashboard.types'

const PROJECT_FIELDS = 'id, name, start_date, close_date, is_archived'
const LEGACY_PROJECT_FIELDS = 'id, name, start_date, close_date'
const ENTRY_FIELDS = 'id, project_id, type, amount, description, entry_date, seq'
const LEGACY_ENTRY_FIELDS = 'id, project_id, type, amount, description, entry_date'

async function findProjects(): Promise<DashboardProjectRecord[]> {
  const supabase = getSupabaseClient()
  const currentResult = await supabase
    .from('projects')
    .select(PROJECT_FIELDS)
    .order('name', { ascending: true })

  if (!currentResult.error) return (currentResult.data ?? []) as DashboardProjectRecord[]

  const legacyResult = await supabase
    .from('projects')
    .select(LEGACY_PROJECT_FIELDS)
    .order('name', { ascending: true })

  if (legacyResult.error) throw legacyResult.error

  return (legacyResult.data ?? []) as DashboardProjectRecord[]
}

async function findEntries(): Promise<DashboardEntryRecord[]> {
  const supabase = getSupabaseClient()
  const currentResult = await supabase.from('entries').select(ENTRY_FIELDS).order('seq', { ascending: false })

  if (!currentResult.error) return (currentResult.data ?? []) as DashboardEntryRecord[]

  const legacyResult = await supabase
    .from('entries')
    .select(LEGACY_ENTRY_FIELDS)
    .order('entry_date', { ascending: false })

  if (legacyResult.error) {
    console.error('Dashboard entries could not be loaded.', legacyResult.error)
    return []
  }

  return (legacyResult.data ?? []) as DashboardEntryRecord[]
}

export async function findDashboardData(): Promise<DashboardSourceData> {
  const [projects, entries] = await Promise.all([findProjects(), findEntries()])

  return { projects, entries }
}

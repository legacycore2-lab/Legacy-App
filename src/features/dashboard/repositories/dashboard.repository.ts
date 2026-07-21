import { getSupabaseClient } from '../../../lib/supabase/client'
import type {
  DashboardEntryRecord,
  DashboardProjectRecord,
  DashboardSourceData,
} from '../types/dashboard.types'

const PROJECT_FIELDS = 'id, name, start_date, close_date, is_archived'
const ENTRY_FIELDS = 'id, project_id, type, amount, description, entry_date, seq'

export async function findDashboardData(): Promise<DashboardSourceData> {
  const supabase = getSupabaseClient()
  const [projectsResult, entriesResult] = await Promise.all([
    supabase.from('projects').select(PROJECT_FIELDS).order('name', { ascending: true }),
    supabase.from('entries').select(ENTRY_FIELDS).order('seq', { ascending: false }).limit(100),
  ])

  if (projectsResult.error) throw projectsResult.error
  if (entriesResult.error) throw entriesResult.error

  return {
    projects: (projectsResult.data ?? []) as DashboardProjectRecord[],
    entries: (entriesResult.data ?? []) as DashboardEntryRecord[],
  }
}

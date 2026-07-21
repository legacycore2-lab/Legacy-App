import { getSupabaseClient } from '../../../lib/supabase/client'
import type {
  DashboardEntryRecord,
  DashboardProjectRecord,
  DashboardSourceData,
} from '../types/dashboard.types'

async function findProjects(): Promise<DashboardProjectRecord[]> {
  const { data, error } = await getSupabaseClient().from('projects').select('*')

  if (error) throw error

  return (data ?? []) as DashboardProjectRecord[]
}

async function findEntries(): Promise<DashboardEntryRecord[]> {
  const { data, error } = await getSupabaseClient().from('entries').select('*')

  if (error) {
    console.error('Dashboard entries could not be loaded.', error)
    return []
  }

  return (data ?? []) as DashboardEntryRecord[]
}

export async function findDashboardData(): Promise<DashboardSourceData> {
  const [projects, entries] = await Promise.all([findProjects(), findEntries()])

  return { projects, entries }
}

import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardProjectRecord = {
  id: string
  name: string
  client_name?: string | null
  progress?: number | null
  start_date?: string | null
  close_date?: string | null
  is_archived?: boolean | null
}

export async function findDashboardProjects(): Promise<DashboardProjectRecord[]> {
  const { data, error } = await getSupabaseClient().from('projects').select('*').limit(100)

  if (error) throw error

  return ((data ?? []) as DashboardProjectRecord[])
    .filter((project) => project.is_archived !== true)
    .sort((left, right) => left.name.localeCompare(right.name, 'ar'))
    .slice(0, 12)
}

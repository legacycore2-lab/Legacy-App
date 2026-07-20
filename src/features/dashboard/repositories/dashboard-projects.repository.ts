import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardProjectRecord = {
  id: string
  name: string
  client_name: string | null
  progress: number | null
  start_date: string | null
  close_date: string | null
  is_archived: boolean | null
}

export async function findDashboardProjects(): Promise<DashboardProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, client_name, progress, start_date, close_date, is_archived')
    .or('is_archived.is.null,is_archived.eq.false')
    .order('name', { ascending: true })
    .limit(12)

  if (error) throw error
  return (data ?? []) as DashboardProjectRecord[]
}

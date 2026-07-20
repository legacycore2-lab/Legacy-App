import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardProjectRecord = {
  id: string
  name: string
  close_date: string | null
  is_archived: boolean | null
}

export async function findDashboardProjects(): Promise<DashboardProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, close_date, is_archived')
    .eq('is_archived', false)
    .order('name', { ascending: true })
    .limit(12)

  if (error) throw error
  return (data ?? []) as DashboardProjectRecord[]
}

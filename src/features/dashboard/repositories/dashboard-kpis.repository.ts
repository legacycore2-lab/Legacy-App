import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardKpiEntryRecord = {
  type: 'i' | 'e'
  amount: number | string | null
}

export type DashboardKpiSource = {
  entries: DashboardKpiEntryRecord[]
  activeProjectsCount: number
}

export async function findDashboardKpiSource(): Promise<DashboardKpiSource> {
  const supabase = getSupabaseClient()
  const [entriesResult, projectsResult] = await Promise.all([
    supabase.from('entries').select('type, amount'),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('is_archived', false),
  ])

  if (entriesResult.error) throw entriesResult.error
  if (projectsResult.error) throw projectsResult.error

  return {
    entries: (entriesResult.data ?? []) as DashboardKpiEntryRecord[],
    activeProjectsCount: projectsResult.count ?? 0,
  }
}

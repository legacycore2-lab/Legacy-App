import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardProjectEntryRecord = {
  project_id: string
  type: 'i' | 'e'
  amount: number | string | null
}

export async function findDashboardProjectEntries(
  projectIds: string[],
): Promise<DashboardProjectEntryRecord[]> {
  if (projectIds.length === 0) return []

  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select('project_id, type, amount')
    .in('project_id', projectIds)

  if (error) throw error
  return (data ?? []) as DashboardProjectEntryRecord[]
}

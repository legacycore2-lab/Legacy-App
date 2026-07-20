import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardRecentEntryRecord = {
  id: string
  seq: number | null
  type: 'i' | 'e'
  amount: number | string | null
  description: string | null
  entry_date: string | null
  projects: { name: string } | { name: string }[] | null
}

export async function findDashboardRecentEntries(): Promise<DashboardRecentEntryRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select('id, seq, type, amount, description, entry_date, projects(name)')
    .order('seq', { ascending: false, nullsFirst: false })
    .limit(6)

  if (error) throw error
  return (data ?? []) as DashboardRecentEntryRecord[]
}

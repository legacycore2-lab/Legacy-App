import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardRecentEntryRecord = {
  id: string
  project_id?: string | null
  seq?: number | null
  type?: 'i' | 'e' | string | null
  amount?: number | string | null
  description?: string | null
  entry_date?: string | null
}

function entrySortValue(entry: DashboardRecentEntryRecord): number {
  const sequence = Number(entry.seq)
  if (Number.isFinite(sequence)) return sequence

  const timestamp = entry.entry_date ? Date.parse(entry.entry_date) : Number.NaN
  return Number.isFinite(timestamp) ? timestamp : 0
}

export async function findDashboardRecentEntries(): Promise<DashboardRecentEntryRecord[]> {
  const { data, error } = await getSupabaseClient().from('entries').select('*').limit(100)

  if (error) throw error

  return ((data ?? []) as DashboardRecentEntryRecord[])
    .sort((left, right) => entrySortValue(right) - entrySortValue(left))
    .slice(0, 6)
}

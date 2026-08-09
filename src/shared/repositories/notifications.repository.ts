import { getSupabaseClient } from '../../lib/supabase/client'

export interface OverdueAdvanceNotificationRow {
  id: string
  holder_name: string
  due_date: string
  amount: number
  spent_amount: number
  returned_amount: number
}

export async function findAdvanceNotificationData() {
  const client = getSupabaseClient()
  const { data: settings } = await client
    .from('system_settings')
    .select('settings')
    .eq('id', 'default')
    .maybeSingle()
  const config = (settings?.settings ?? {}) as {
    overdueAdvanceNotifications?: boolean
    dailySummary?: boolean
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await client
    .from('advances')
    .select('id,holder_name,due_date,amount,spent_amount,returned_amount')
    .lt('due_date', today)
    .order('due_date')
    .limit(10)

  if (error) throw error
  return { config, rows: (data ?? []) as OverdueAdvanceNotificationRow[] }
}

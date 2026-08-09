import { AppError } from '../../../shared/errors/app-error'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type { SystemSettings, SystemSettingsRow } from '../types/settings.types'

export async function findSystemSettings(): Promise<SystemSettingsRow | null> {
  const { data, error } = await getSupabaseClient()
    .from('system_settings')
    .select('settings,updated_at,updated_by_name')
    .eq('id', 'default')
    .maybeSingle()
  if (error) throw new AppError(error.message, 'SETTINGS_FETCH_FAILED')
  return data as SystemSettingsRow | null
}

export async function updateSystemSettings(
  settings: Omit<SystemSettings, 'updatedAt' | 'updatedByName'>,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('update_system_settings', { p_settings: settings })
  if (error) throw new AppError(error.message, 'SETTINGS_UPDATE_FAILED')
}

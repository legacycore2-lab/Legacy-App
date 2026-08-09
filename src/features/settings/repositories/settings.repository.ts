import { AppError } from '../../../shared/errors/app-error'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type { SettingsAuditEntry, SystemSettings, SystemSettingsRow } from '../types/settings.types'

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

export async function uploadCompanyLogo(file: File): Promise<string> {
  const client = getSupabaseClient()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `logo/company-logo.${extension}`
  const { error } = await client.storage
    .from('company-assets')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new AppError(error.message, 'COMPANY_LOGO_UPLOAD_FAILED')
  return `${client.storage.from('company-assets').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
}

export async function findSettingsAudit(): Promise<SettingsAuditEntry[]> {
  const { data, error } = await getSupabaseClient()
    .from('system_settings_audit')
    .select('id,actor_name,changed_keys,created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new AppError(error.message, 'SETTINGS_AUDIT_FETCH_FAILED')
  return (data ?? []).map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    changedKeys: row.changed_keys ?? [],
    createdAt: row.created_at,
  }))
}

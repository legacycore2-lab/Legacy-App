import {
  findSettingsAudit,
  findSystemSettings,
  updateSystemSettings,
  uploadCompanyLogo,
} from '../repositories/settings.repository'
import type { SystemSettings } from '../types/settings.types'

export const defaultSettings: SystemSettings = {
  companyLegalName: '',
  companyTradeName: '',
  taxRegistrationNumber: '',
  commercialRegistrationNumber: '',
  phone: '',
  email: '',
  address: '',
  logoUrl: '',
  systemNameAr: 'ليجاسي كور',
  systemNameEn: 'LEGACY CORE',
  country: 'EG',
  currency: 'EGP',
  language: 'ar',
  timezone: 'Africa/Cairo',
  fiscalYearStartMonth: 1,
  vatEnabled: true,
  vatRate: 14,
  pricesIncludeVat: false,
  journalPrefix: 'JE',
  projectPrefix: 'PRJ',
  advancePrefix: 'ADV',
  nextJournalNumber: 1,
  nextProjectNumber: 1,
  nextAdvanceNumber: 1,
  emailNotifications: true,
  overdueAdvanceNotifications: true,
  dailySummary: false,
  sessionTimeoutMinutes: 60,
  requireStrongPasswords: true,
  updatedAt: '',
  updatedByName: '',
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const row = await findSystemSettings()
  if (!row) return defaultSettings
  return {
    ...defaultSettings,
    ...row.settings,
    updatedAt: row.updated_at,
    updatedByName: row.updated_by_name ?? 'مدير النظام',
  }
}

export function validateSettings(settings: SystemSettings): string[] {
  const errors: string[] = []
  if (!settings.companyLegalName.trim()) errors.push('الاسم القانوني للشركة مطلوب.')
  if (settings.email && !/^\S+@\S+\.\S+$/.test(settings.email)) errors.push('البريد الإلكتروني غير صالح.')
  if (settings.vatEnabled && (settings.vatRate < 0 || settings.vatRate > 100))
    errors.push('نسبة الضريبة يجب أن تكون بين صفر و100.')
  if (settings.sessionTimeoutMinutes < 5 || settings.sessionTimeoutMinutes > 1440)
    errors.push('مدة الجلسة يجب أن تكون بين 5 و1440 دقيقة.')
  return errors
}

export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  const errors = validateSettings(settings)
  if (errors.length) throw new Error(errors[0])
  const { updatedAt: _, updatedByName: __, ...payload } = settings
  void _
  void __
  await updateSystemSettings(payload)
}

export const getSettingsAudit = findSettingsAudit
export async function saveCompanyLogo(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type))
    throw new Error('صيغة الشعار غير مدعومة.')
  if (file.size > 2 * 1024 * 1024) throw new Error('حجم الشعار يجب ألا يتجاوز 2 ميجابايت.')
  return uploadCompanyLogo(file)
}

export type SettingsTab = 'general' | 'financial' | 'documents' | 'notifications' | 'security' | 'audit'

export interface SystemSettings {
  companyLegalName: string
  companyTradeName: string
  taxRegistrationNumber: string
  commercialRegistrationNumber: string
  phone: string
  email: string
  address: string
  logoUrl: string
  systemNameAr: string
  systemNameEn: string
  country: 'EG'
  currency: 'EGP'
  language: 'ar'
  timezone: 'Africa/Cairo'
  fiscalYearStartMonth: number
  vatEnabled: boolean
  vatRate: number
  pricesIncludeVat: boolean
  journalPrefix: string
  projectPrefix: string
  advancePrefix: string
  nextJournalNumber: number
  nextProjectNumber: number
  nextAdvanceNumber: number
  emailNotifications: boolean
  overdueAdvanceNotifications: boolean
  dailySummary: boolean
  sessionTimeoutMinutes: number
  requireStrongPasswords: boolean
  updatedAt: string
  updatedByName: string
}

export interface SystemSettingsRow {
  settings: Omit<SystemSettings, 'updatedAt' | 'updatedByName'>
  updated_at: string
  updated_by_name: string | null
}
export interface SettingsAuditEntry {
  id: string
  actorName: string
  changedKeys: string[]
  createdAt: string
}

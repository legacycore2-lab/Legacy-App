/**
 * Legacy Core ERP — Supabase Database Types
 *
 * Manually maintained until Supabase CLI access is available.
 * These types replace `as unknown as` casts in repositories.
 *
 * Tables: projects, entries, journals, journal_lines, accounts
 */

/* ─── Shared ──────────────────────────────────────────────────────────────── */

export type DbProjectStatus = 'active' | 'completed' | 'paused' | 'archived' | 'closed' | 'open'
export type DbEntryType = 'income' | 'expense' | 'i' | 'e'
export type DbAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type DbNormalBalance = 'debit' | 'credit'
export type DbJournalStatus = 'draft' | 'posted' | 'reversed'

/* ─── projects ────────────────────────────────────────────────────────────── */

export type ProjectRow = {
  id: string
  name: string
  code: string | null
  client_name: string | null
  location: string | null
  manager: string | null
  status: DbProjectStatus | null
  progress: number | null
  contract_value: number | null
  received: number | null
  spent: number | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export type ProjectInsertRow = Omit<ProjectRow, 'id' | 'created_at' | 'updated_at' | 'created_by'>

/* ─── entries ─────────────────────────────────────────────────────────────── */

export type EntryRow = {
  id: string
  entry_number: number | null
  entry_date: string
  entry_type: DbEntryType
  category: string | null
  description: string | null
  contractor_name: string | null
  payment_method: string | null
  amount: number
  project_id: string | null
  entry_code: string | null
  created_at: string | null
}

/* ─── journals ────────────────────────────────────────────────────────────── */

export type JournalRow = {
  id: string
  journal_number: number
  journal_date: string
  description: string
  status: DbJournalStatus
  created_at: string
  posted_at: string | null
  source_type: string | null
  source_id: string | null
}

/* ─── journal_lines ───────────────────────────────────────────────────────── */

export type JournalLineRow = {
  id: string
  journal_id: string
  line_number: number
  description: string | null
  debit: number
  credit: number
  account_id: string | null
}

/* ─── accounts ────────────────────────────────────────────────────────────── */

export type AccountRow = {
  id: string
  code: string
  name_ar: string
  name_en: string | null
  account_type: DbAccountType
  normal_balance: DbNormalBalance
  parent_id: string | null
  level: number
  is_postable: boolean
  is_active: boolean
}

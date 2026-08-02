// ─── Raw DB record (repository boundary — must not reach UI) ──────────────────

export type ContractorEntryRecord = {
  id: string
  contractor_name: string | null
  project_id: string | null
  entry_date: string
  /** Raw DB value — may be 'income'|'expense'|'i'|'e' or anything else.
   *  Normalised to 'income'|'expense'|null in the service layer. */
  entry_type: string | null
  amount: number | string
  description: string | null
  entry_number: number | null
  projects: { id: string; name: string } | null
}

// ─── Domain model ─────────────────────────────────────────────────────────────

export type ContractorProject = {
  id: string
  name: string
}

export type ContractorEntry = {
  id: string
  entryDate: string
  /** 'unknown' when the raw DB entry_type could not be normalised */
  entryType: 'income' | 'expense' | 'unknown'
  amount: number
  description: string
  seq: number | null
  projectId: string | null
  projectName: string
}

export type Contractor = {
  /** Normalised display name (trimmed, collapsed spaces) */
  name: string
  /** Dedup key: Latin chars lowercased, Arabic preserved as-is */
  key: string
  entryCount: number
  projectCount: number
  totalIncome: number
  totalExpense: number
  netMovement: number
  latestActivityDate: string
  projects: ContractorProject[]
  entries: ContractorEntry[]
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

export type ContractorSort = 'name' | 'expense' | 'entries' | 'latest'

export type ContractorsViewModel = {
  contractors: Contractor[]
  totalContractors: number
  totalExpense: number
  totalProjects: number
  totalEntries: number
}

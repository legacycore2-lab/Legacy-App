// ─── Raw DB record (repository boundary — must not reach UI) ──────────────────

export type ContractorEntryRecord = {
  id: string
  contractor_name: string | null
  project_id: string | null
  entry_date: string
  entry_type: 'income' | 'expense'
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
  entryType: 'income' | 'expense'
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

// ─── Raw DB record (repository boundary) ─────────────────────────────────────

export type ProjectContractorRecord = {
  id: string
  contractor_name: string | null
  project_id: string | null
  /** Raw DB value — may be 'income'|'expense'|'i'|'e' or anything else. */
  entry_type: string | null
  amount: number | string
  entry_date: string
  description: string | null
  entry_number: number | null
  projects: { id: string; name: string } | null
}

// ─── Domain model ─────────────────────────────────────────────────────────────

export type ContractorEntry = {
  id: string
  entryDate: string
  /** 'unknown' when raw DB entry_type could not be normalised */
  entryType: 'income' | 'expense' | 'unknown'
  amount: number
  description: string
  seq: number | null
  projectId: string | null
  projectName: string
}

export type ProjectContractor = {
  name: string
  key: string
  entryCount: number
  totalIncome: number
  totalExpense: number
  netMovement: number
  latestActivityDate: string
  entries: ContractorEntry[]
}

export type ProjectContractorsViewModel = {
  contractors: ProjectContractor[]
  totalContractors: number
  totalExpense: number
  totalIncome: number
  totalEntries: number
  hasData: boolean
}

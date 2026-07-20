export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived'

export type Project = {
  id: string
  name: string
  client: string
  location: string
  manager: string
  status: ProjectStatus
  progress: number
  contractValue: number
  received: number
  spent: number
  startDate: string
  endDate: string
}

export type ProjectStatusFilter = 'all' | ProjectStatus

export type ProjectsQuery = {
  query: string
  status: ProjectStatusFilter
}

export type ProjectRow = Project & {
  balance: number
}

export type ProjectsSummary = {
  total: number
  active: number
  completed: number
  paused: number
  totalContracts: number
  totalLiquidity: number
}

// ── DB layer ─────────────────────────────────────────────────────
// Mirrors the exact column names returned by Supabase.
// Never import this type outside the repository and mapper.
export type ProjectRecord = {
  id: string
  code: string | null
  name: string
  client_name: string | null
  location: string | null
  manager: string | null
  status: string
  progress: number
  contract_value: number | string
  received: number | string
  spent: number | string
  start_date: string | null
  end_date: string | null
  notes: string | null
}

export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived'

export type Project = {
  id: string
  code: string
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
  notes: string
}

export type ProjectStatusFilter = 'all' | ProjectStatus

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

/**
 * Database representation returned by Supabase.
 * This type stays at the repository/mapper boundary and must not reach the UI.
 * Optional compatibility fields support the current legacy schema while the
 * mapper exposes one stable domain model to the rest of the feature.
 */
export type ProjectRecord = {
  id: string
  name: string
  code?: string | null
  client_name?: string | null
  location?: string | null
  manager?: string | null
  status?: string | null
  progress?: number | string | null
  contract_value?: number | string | null
  received?: number | string | null
  spent?: number | string | null
  start_date?: string | null
  end_date?: string | null
  close_date?: string | null
  notes?: string | null
  is_archived?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
}

export type ProjectInsertRecord = {
  name: string
  code: string | null
  client_name: string | null
  location: string | null
  manager: string | null
  status: Exclude<ProjectStatus, 'archived'>
  contract_value: number
  start_date: string
  end_date: string | null
  notes: string | null
  is_archived: false
}

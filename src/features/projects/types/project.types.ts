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

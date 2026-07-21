import type { ProjectStatus } from './project.types'

export type ProjectCreateInput = {
  name: string
  code: string
  client: string
  location: string
  manager: string
  status: ProjectStatus
  contractValue: string
  startDate: string
  endDate: string
  notes: string
}

export type ProjectCreatePreview = {
  name: string
  code: string
  client: string
  location: string
  manager: string
  status: ProjectStatus
  contractValue: number
  startDate: string
  endDate: string
  notes: string
}

export type ReportProjectRecord = {
  id: string
  name: string
  code: string | null
  client_name: string | null
  status: string | null
  progress: number | string | null
  contract_value: number | string | null
  is_archived: boolean | null
}

export type ReportEntryRecord = {
  project_id: string
  entry_type: string | null
  amount: number | string | null
  entry_number: number | null
}

export type ReportProjectRow = {
  id: string
  name: string
  code: string
  client: string
  status: string
  progress: number
  contractValue: number
  income: number
  expense: number
  net: number
  remaining: number
  entryCount: number
  isArchived: boolean
}

export type ReportsSummary = {
  projectCount: number
  contractValue: number
  income: number
  expense: number
  net: number
  remaining: number
}

export type ReportStatusOption = {
  value: string
  count: number
}

export type ReportChartItem = {
  projectId: string
  label: string
  income: number
  expense: number
  net: number
  maxValue: number
}

export type ReportsAnalytics = {
  statusOptions: ReportStatusOption[]
  topProjects: ReportChartItem[]
  profitableProjects: number
  lossProjects: number
}

export type ReportsViewModel = {
  rows: ReportProjectRow[]
  summary: ReportsSummary
}

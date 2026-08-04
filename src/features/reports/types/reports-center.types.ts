export type ReportCategory =
  'all' | 'executive' | 'projects' | 'journal' | 'contractors' | 'financial' | 'documents' | 'system'

export type ReportAvailability = 'available' | 'coming-soon'

export type ReportIconKey =
  | 'chart'
  | 'projects'
  | 'journal'
  | 'insights'
  | 'comparison'
  | 'profit'
  | 'loss'
  | 'categories'
  | 'payments'
  | 'contracts'
  | 'cash-flow'
  | 'contractors'
  | 'attachments'
  | 'audit'

export type ReportKey =
  | 'executive'
  | 'projects'
  | 'journal'
  | 'insights'
  | 'project-comparison'
  | 'profitable-projects'
  | 'loss-making-projects'
  | 'categories'
  | 'payment-methods'
  | 'contract-values'
  | 'income-expense'
  | 'profit-loss'
  | 'monthly-performance'
  | 'period-comparison'
  | 'stalled-projects'
  | 'budget-actual'
  | 'contractor-statement'
  | 'contractor-dues'
  | 'contractor-payments'
  | 'top-contractors'
  | 'cash-flow'
  | 'cash-banks'
  | 'commitments'
  | 'attachments'
  | 'entries-without-documents'
  | 'projects-without-files'
  | 'audit-log'
  | 'user-activity'
  | 'permissions'

export type ReportDefinition = {
  key: ReportKey
  title: string
  description: string
  category: Exclude<ReportCategory, 'all'>
  availability: ReportAvailability
  icon: ReportIconKey
  keywords: string[]
}

export type ReportCategoryDefinition = {
  key: ReportCategory
  label: string
}

export type ReportsCenterSection = {
  category: Exclude<ReportCategory, 'all'>
  title: string
  reports: ReportDefinition[]
}

export type ReportsCenterViewModel = {
  categories: ReportCategoryDefinition[]
  sections: ReportsCenterSection[]
  totalReports: number
  availableReports: number
}

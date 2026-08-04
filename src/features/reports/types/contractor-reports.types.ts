export type ContractorReportEntryRecord = {
  id: string
  entry_number: number | null
  entry_date: string
  entry_type: string | null
  amount: number | string | null
  contractor_name: string | null
  category: string | null
  description: string | null
  payment_method: string | null
  project_id: string | null
  project: { name: string } | { name: string }[] | null
}

export type ContractorReportEntryType = 'income' | 'expense' | 'unknown'

export type ContractorReportEntry = {
  id: string
  entryNumber: number | null
  entryDate: string
  entryType: ContractorReportEntryType
  amount: number
  contractorName: string
  category: string
  description: string
  paymentMethod: string
  projectId: string
  projectName: string
}

export type ContractorReportsFilters = {
  query: string
  contractorName: string
  projectId: string
  category: string
  entryType: 'all' | ContractorReportEntryType
  dateFrom: string
  dateTo: string
}

export type ContractorSummaryRow = {
  contractorName: string
  totalIncome: number
  totalExpense: number
  netMovement: number
  entryCount: number
  projectCount: number
  averageEntryAmount: number
  lastActivityDate: string | null
}

export type ContractorProjectRow = {
  contractorName: string
  projectId: string
  projectName: string
  totalIncome: number
  totalExpense: number
  netMovement: number
  entryCount: number
}

export type ContractorCategoryRow = {
  contractorName: string
  category: string
  totalExpense: number
  entryCount: number
  percentageOfContractorExpense: number
}

export type ContractorMonthlyRow = {
  contractorName: string
  monthKey: string
  totalIncome: number
  totalExpense: number
  netMovement: number
  entryCount: number
}

export type ContractorPaymentMethodRow = {
  contractorName: string
  paymentMethod: string
  totalAmount: number
  entryCount: number
  percentageOfContractorMovement: number
}

export type ContractorDataQualityIssueKind =
  | 'missing-contractor'
  | 'missing-project'
  | 'missing-category'
  | 'missing-payment-method'
  | 'unknown-entry-type'

export type ContractorDataQualityRow = {
  kind: ContractorDataQualityIssueKind
  label: string
  count: number
  totalAmount: number
}

export type ContractorReportsOverview = {
  contractorCount: number
  activeContractorCount: number
  totalIncome: number
  totalExpense: number
  netMovement: number
  entryCount: number
  projectCount: number
  topCostContractor: ContractorSummaryRow | null
}

export type ContractorReportsViewModel = {
  overview: ContractorReportsOverview
  contractors: ContractorSummaryRow[]
  entries: ContractorReportEntry[]
  contractorProjects: ContractorProjectRow[]
  categories: ContractorCategoryRow[]
  monthlyActivity: ContractorMonthlyRow[]
  paymentMethods: ContractorPaymentMethodRow[]
  dataQuality: ContractorDataQualityRow[]
  contractorOptions: string[]
  projectOptions: { id: string; name: string }[]
  categoryOptions: string[]
}

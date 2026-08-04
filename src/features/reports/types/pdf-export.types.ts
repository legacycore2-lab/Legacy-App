export type PdfExportTab =
  | 'executive'
  | 'projects'
  | 'journal'
  | 'insights'
  | 'profit-loss'
  | 'contractor-overview'
  | 'contractor-statement'
  | 'contractor-projects'
  | 'contractor-categories'
  | 'contractor-monthly'
  | 'contractor-payments'
  | 'contractor-quality'

export type PdfKpi = {
  label: string
  value: string
}

export type PdfTableRow = (string | number)[]

export type PdfTable = {
  title: string
  headers: string[]
  rows: PdfTableRow[]
}

export type PdfActiveFilter = {
  label: string
  value: string
}

export type PdfExportPayload = {
  reportTitle: string
  companyName: string
  exportDate: string
  activeTab: PdfExportTab
  kpis: PdfKpi[]
  tables: PdfTable[]
  activeFilters: PdfActiveFilter[]
}

export type PdfFilenameOptions = {
  reportKey: string
  contextLabel?: string
  date?: string
}

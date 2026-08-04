import { buildReportDefinitions } from './reports-center.service'
import type { ReportDefinition, ReportKey } from '../types/reports-center.types'

const IMPLEMENTED_REPORTS = new Set<ReportKey>([
  'executive',
  'projects',
  'journal',
  'insights',
  'profit-loss',
  'contractor-statement',
  'contractor-dues',
  'contractor-payments',
  'top-contractors',
])

const INSIGHTS_REPORT: ReportDefinition = {
  key: 'insights',
  title: 'الرؤى والتنبيهات',
  description: 'تنبيهات تلقائية عن الربحية والمخاطر والمشاريع التي تحتاج مراجعة.',
  category: 'executive',
  availability: 'available',
  icon: 'insights',
  keywords: ['رؤى', 'تنبيهات', 'مخاطر', 'تحليل'],
}

export function getReportsCenterDefinitions(): ReportDefinition[] {
  const definitions = [...buildReportDefinitions(), INSIGHTS_REPORT]

  return definitions.map((report) => ({
    ...report,
    availability: IMPLEMENTED_REPORTS.has(report.key) ? 'available' : 'coming-soon',
    keywords: [...report.keywords],
  }))
}

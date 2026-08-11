import type { ContractorReportsViewModel } from '../types/contractor-reports.types'
import type { ProfitLossViewModel } from '../types/profit-loss.types'
import type { ReportKey } from '../types/reports-center.types'
import type {
  ReportJournalRow,
  ReportProjectRow,
  ReportsTab,
  TabularRow,
} from '../types/report.types'

export type ContractorReportSection = 'overview' | 'statement' | 'payments'

const CONTRACTOR_REPORT_KEYS = new Set<ReportKey>([
  'contractor-statement',
  'contractor-dues',
  'contractor-payments',
  'top-contractors',
])

const REPORT_TITLES: Partial<Record<ReportKey, string>> = {
  executive: 'الملخص التنفيذي',
  projects: 'تقرير المشاريع',
  journal: 'تقرير القيود اليومية',
  insights: 'الرؤى والتنبيهات',
  'profit-loss': 'الأرباح والخسائر',
  'project-comparison': 'مقارنة المشاريع',
  'profitable-projects': 'المشاريع الأكثر ربحًا',
  'loss-making-projects': 'المشاريع الخاسرة',
  'contract-values': 'قيمة العقود',
  'income-expense': 'الإيرادات والمصروفات',
  'contractor-statement': 'كشف حساب المقاول',
  'contractor-dues': 'تحليلات حركة المقاولين',
  'contractor-payments': 'مدفوعات المقاولين',
  'top-contractors': 'أعلى المقاولين تكلفة',
}

export function resolveReportsTab(report: ReportKey | null): ReportsTab | null {
  if (
    report === 'executive' ||
    report === 'projects' ||
    report === 'journal' ||
    report === 'insights'
  ) {
    return report
  }
  if (
    report === 'project-comparison' ||
    report === 'profitable-projects' ||
    report === 'loss-making-projects' ||
    report === 'contract-values' ||
    report === 'income-expense'
  ) {
    return 'projects'
  }
  return null
}

export function resolveContractorReportSection(
  report: ReportKey | null,
): ContractorReportSection {
  if (report === 'contractor-statement') return 'statement'
  if (report === 'contractor-payments') return 'payments'
  return 'overview'
}

export function isContractorReport(report: ReportKey | null): boolean {
  return report ? CONTRACTOR_REPORT_KEYS.has(report) : false
}

export function getReportTitle(report: ReportKey | null): string {
  return report ? REPORT_TITLES[report] ?? 'التقرير' : 'التقرير'
}

export function selectProjectReportRows(
  report: ReportKey | null,
  rows: ReportProjectRow[],
): ReportProjectRow[] {
  if (report === 'profitable-projects') {
    return rows.filter((row) => row.net > 0).sort((a, b) => b.net - a.net)
  }
  if (report === 'loss-making-projects') {
    return rows.filter((row) => row.net < 0).sort((a, b) => a.net - b.net)
  }
  return rows
}

type BuildTabularRowsInput = {
  selectedReport: ReportKey | null
  activeTab: ReportsTab | null
  executiveRows: ReportProjectRow[]
  projectRows: ReportProjectRow[]
  journalRows: ReportJournalRow[]
  profitLoss: ProfitLossViewModel | null
  contractors: ContractorReportsViewModel | null
}

export function buildReportTabularRows(input: BuildTabularRowsInput): TabularRow[] {
  const {
    selectedReport,
    activeTab,
    executiveRows,
    projectRows,
    journalRows,
    profitLoss,
    contractors,
  } = input

  if (activeTab === 'executive' || activeTab === 'projects') {
    const rows = activeTab === 'executive' ? executiveRows : projectRows
    return rows.map((row) => ({
      'كود المشروع': row.code,
      'اسم المشروع': row.name,
      العميل: row.client,
      الحالة: row.status,
      'نسبة الإنجاز': row.progress,
      'قيمة العقد': row.contractValue,
      الإيرادات: row.income,
      المصروفات: row.expense,
      الصافي: row.net,
      المتبقي: row.remaining,
    }))
  }

  if (activeTab === 'journal') {
    return journalRows.map((row) => ({
      التاريخ: row.dateFormatted,
      النوع: row.entryType,
      المشروع: row.projectName,
      المقاول: row.contractorName,
      البيان: row.description,
      'طريقة الدفع': row.paymentMethod,
      المبلغ: row.amount,
    }))
  }

  if (profitLoss) {
    return profitLoss.projectRows.map((row) => ({
      المشروع: row.projectName,
      'قيمة العقد': row.contractValue,
      الإيرادات: row.income,
      المصروفات: row.expense,
      الصافي: row.net,
      'هامش الربح': row.marginPercent,
      'عدد القيود': row.entryCount,
    }))
  }

  if (!contractors) return []

  if (selectedReport === 'contractor-payments') {
    return contractors.paymentMethods.map((row) => ({
      المقاول: row.contractorName,
      'طريقة الدفع': row.paymentMethod,
      القيمة: row.totalAmount,
      'عدد القيود': row.entryCount,
      النسبة: row.percentageOfContractorMovement,
    }))
  }

  if (selectedReport === 'top-contractors') {
    return [...contractors.contractors]
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .map((row, index) => ({
        الترتيب: index + 1,
        المقاول: row.contractorName,
        'إجمالي التكلفة': row.totalExpense,
        'عدد المشاريع': row.projectCount,
        'عدد القيود': row.entryCount,
        'آخر نشاط': row.lastActivityDate,
      }))
  }

  return contractors.contractors.map((row) => ({
    المقاول: row.contractorName,
    الإيرادات: row.totalIncome,
    المصروفات: row.totalExpense,
    'صافي الحركة': row.netMovement,
    'عدد القيود': row.entryCount,
    'عدد المشاريع': row.projectCount,
    'آخر نشاط': row.lastActivityDate,
  }))
}

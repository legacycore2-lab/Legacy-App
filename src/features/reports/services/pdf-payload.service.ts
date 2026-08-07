import { formatPdfMoneyInteger as formatMoneyInteger } from './pdf-formatters'
import type { ContractorReportsFilters, ContractorReportsViewModel } from '../types/contractor-reports.types'
import type { PdfActiveFilter, PdfExportPayload, PdfExportTab } from '../types/pdf-export.types'
import type { ProfitLossFilters, ProfitLossViewModel } from '../types/profit-loss.types'
import type { ExecutiveViewModel, JournalReportFilters, JournalReportViewModel } from '../types/report.types'

import { COMPANY_NAME } from '../config/pdf-brand.config'

const COMPANY = COMPANY_NAME

function todayLabel(): string {
  return new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatPct(v: number | null): string {
  return v === null ? '—' : `${v}%`
}

// ── Executive ─────────────────────────────────────────────────────────────────

export function buildExecutivePdfPayload(data: ExecutiveViewModel): PdfExportPayload {
  return {
    reportTitle: 'الملخص التنفيذي',
    companyName: COMPANY,
    exportDate: todayLabel(),
    activeTab: 'executive',
    activeFilters: [],
    kpis: [
      { label: 'المشاريع', value: String(data.summary.projectCount) },
      { label: 'قيمة العقود', value: formatMoneyInteger(data.summary.contractValue) },
      { label: 'الإيرادات', value: formatMoneyInteger(data.summary.income) },
      { label: 'المصروفات', value: formatMoneyInteger(data.summary.expense) },
      { label: 'الصافي', value: formatMoneyInteger(data.summary.net) },
    ],
    tables: [
      {
        title: 'أعلى المشاريع ربحاً',
        headers: ['المشروع', 'العميل', 'الإيرادات', 'المصروفات', 'الصافي'],
        rows: data.topProjects.profitable
          .slice(0, 10)
          .map((r) => [
            r.name,
            r.client,
            formatMoneyInteger(r.income),
            formatMoneyInteger(r.expense),
            formatMoneyInteger(r.net),
          ]),
      },
    ],
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function buildProjectsPdfPayload(
  rows: ExecutiveViewModel['rows'],
  filters: { query: string; statusFilter: string; includeArchived: boolean },
): PdfExportPayload {
  const activeFilters: PdfActiveFilter[] = []
  if (filters.query) activeFilters.push({ label: 'بحث', value: filters.query })
  if (filters.statusFilter) activeFilters.push({ label: 'الحالة', value: filters.statusFilter })
  if (filters.includeArchived) activeFilters.push({ label: 'المؤرشفة', value: 'مُدرجة' })

  return {
    reportTitle: 'تقرير المشاريع',
    companyName: COMPANY,
    exportDate: todayLabel(),
    activeTab: 'projects',
    activeFilters,
    kpis: [{ label: 'عدد المشاريع', value: String(rows.length) }],
    tables: [
      {
        title: 'الأداء المالي للمشاريع',
        headers: ['المشروع', 'العميل', 'الحالة', 'قيمة العقد', 'الإيرادات', 'المصروفات', 'الصافي', 'الإنجاز'],
        rows: rows.map((r) => [
          r.name,
          r.client,
          r.status,
          formatMoneyInteger(r.contractValue),
          formatMoneyInteger(r.income),
          formatMoneyInteger(r.expense),
          formatMoneyInteger(r.net),
          `${r.progress}%`,
        ]),
      },
    ],
  }
}

// ── Journal ───────────────────────────────────────────────────────────────────

export function buildJournalPdfPayload(
  data: JournalReportViewModel,
  filters: JournalReportFilters,
  filteredCount: number,
): PdfExportPayload {
  const activeFilters: PdfActiveFilter[] = []
  if (filters.dateFrom) activeFilters.push({ label: 'من', value: filters.dateFrom })
  if (filters.dateTo) activeFilters.push({ label: 'إلى', value: filters.dateTo })
  if (filters.projectId) {
    const name = data.projectOptions.find((p) => p.id === filters.projectId)?.name ?? filters.projectId
    activeFilters.push({ label: 'المشروع', value: name })
  }
  if (filters.contractorName) activeFilters.push({ label: 'المقاول', value: filters.contractorName })
  if (filters.paymentMethod) activeFilters.push({ label: 'طريقة الدفع', value: filters.paymentMethod })
  if (filters.entryType !== 'all') activeFilters.push({ label: 'النوع', value: filters.entryType })
  if (filters.query) activeFilters.push({ label: 'بحث', value: filters.query })

  const totalIncome = data.allRows.reduce(
    (sum, row) => sum + (row.entryType === 'income' ? row.amount : 0),
    0,
  )
  const totalExpense = data.allRows.reduce(
    (sum, row) => sum + (row.entryType === 'expense' ? row.amount : 0),
    0,
  )
  const net = totalIncome - totalExpense

  return {
    reportTitle: 'تقرير القيود اليومية',
    companyName: COMPANY,
    exportDate: todayLabel(),
    activeTab: 'journal',
    activeFilters,
    kpis: [
      { label: 'عدد القيود', value: String(filteredCount) },
      { label: 'إجمالي الإيرادات', value: formatMoneyInteger(totalIncome) },
      { label: 'إجمالي المصروفات', value: formatMoneyInteger(totalExpense) },
      { label: 'الصافي', value: formatMoneyInteger(net) },
    ],
    tables: [
      {
        title: 'تفاصيل القيود',
        headers: ['التاريخ', 'المشروع', 'البيان', 'المقاول', 'طريقة الدفع', 'النوع', 'إيراد', 'مصروف'],
        rows: data.allRows.map((row) => [
          row.dateFormatted || row.date,
          row.projectName,
          row.description,
          row.contractorName,
          row.paymentMethod,
          row.entryType === 'income' ? 'إيراد' : row.entryType === 'expense' ? 'مصروف' : 'غير محدد',
          row.entryType === 'income' ? formatMoneyInteger(row.amount) : '—',
          row.entryType === 'expense' ? formatMoneyInteger(row.amount) : '—',
        ]),
      },
    ],
  }
}

// ── Profit & Loss ─────────────────────────────────────────────────────────────

export function buildProfitLossPdfPayload(
  data: ProfitLossViewModel,
  filters: ProfitLossFilters,
): PdfExportPayload {
  const activeFilters: PdfActiveFilter[] = []
  if (filters.dateFrom) activeFilters.push({ label: 'من', value: filters.dateFrom })
  if (filters.dateTo) activeFilters.push({ label: 'إلى', value: filters.dateTo })
  if (filters.projectId) {
    const name = data.projectOptions.find((p) => p.id === filters.projectId)?.name ?? filters.projectId
    activeFilters.push({ label: 'المشروع', value: name })
  }

  return {
    reportTitle: 'الأرباح والخسائر',
    companyName: COMPANY,
    exportDate: todayLabel(),
    activeTab: 'profit-loss',
    activeFilters,
    kpis: [
      { label: 'الإيرادات', value: formatMoneyInteger(data.summary.totalIncome) },
      { label: 'المصروفات', value: formatMoneyInteger(data.summary.totalExpense) },
      { label: 'الصافي', value: formatMoneyInteger(data.summary.netProfit) },
      { label: 'هامش الربح', value: formatPct(data.summary.profitMarginPercent) },
      { label: 'المشاريع', value: String(data.summary.projectCount) },
    ],
    tables: [
      {
        title: 'تفاصيل الربحية حسب المشروع',
        headers: ['المشروع', 'قيمة العقد', 'الإيرادات', 'المصروفات', 'الصافي', 'الهامش', 'القيود'],
        rows: data.projectRows.map((r) => [
          r.projectName,
          formatMoneyInteger(r.contractValue),
          formatMoneyInteger(r.income),
          formatMoneyInteger(r.expense),
          formatMoneyInteger(r.net),
          formatPct(r.marginPercent),
          r.entryCount,
        ]),
      },
      {
        title: 'الأداء الشهري',
        headers: ['الشهر', 'الإيرادات', 'المصروفات', 'الصافي'],
        rows: data.monthlyRows.map((r) => [
          r.monthLabel,
          formatMoneyInteger(r.income),
          formatMoneyInteger(r.expense),
          formatMoneyInteger(r.net),
        ]),
      },
    ],
  }
}

// ── Contractors ───────────────────────────────────────────────────────────────

type ContractorSection =
  'overview' | 'statement' | 'projects' | 'categories' | 'monthly' | 'payments' | 'quality'

const CONTRACTOR_TAB_MAP: Record<ContractorSection, PdfExportTab> = {
  overview: 'contractor-overview',
  statement: 'contractor-statement',
  projects: 'contractor-projects',
  categories: 'contractor-categories',
  monthly: 'contractor-monthly',
  payments: 'contractor-payments',
  quality: 'contractor-quality',
}

const CONTRACTOR_TITLE_MAP: Record<ContractorSection, string> = {
  overview: 'ملخص المقاولين',
  statement: 'كشف حساب المقاول',
  projects: 'المقاولون حسب المشروع',
  categories: 'المقاولون حسب البند',
  monthly: 'النشاط الشهري للمقاولين',
  payments: 'طرق دفع المقاولين',
  quality: 'جودة بيانات المقاولين',
}

export function buildContractorsPdfPayload(
  data: ContractorReportsViewModel,
  filters: ContractorReportsFilters,
  activeSection: ContractorSection,
): PdfExportPayload {
  const activeFilters: PdfActiveFilter[] = []
  if (filters.contractorName) activeFilters.push({ label: 'المقاول', value: filters.contractorName })
  if (filters.projectId) {
    const name = data.projectOptions.find((p) => p.id === filters.projectId)?.name ?? filters.projectId
    activeFilters.push({ label: 'المشروع', value: name })
  }
  if (filters.category) activeFilters.push({ label: 'البند', value: filters.category })
  if (filters.entryType !== 'all') activeFilters.push({ label: 'النوع', value: filters.entryType })
  if (filters.dateFrom) activeFilters.push({ label: 'من', value: filters.dateFrom })
  if (filters.dateTo) activeFilters.push({ label: 'إلى', value: filters.dateTo })
  if (filters.query) activeFilters.push({ label: 'بحث', value: filters.query })

  const kpis = [
    { label: 'المقاولون', value: String(data.overview.contractorCount) },
    { label: 'المصروفات', value: formatMoneyInteger(data.overview.totalExpense) },
    { label: 'الإيرادات', value: formatMoneyInteger(data.overview.totalIncome) },
    { label: 'الصافي', value: formatMoneyInteger(data.overview.netMovement) },
    { label: 'القيود', value: String(data.overview.entryCount) },
  ]

  const tables = buildContractorTabTables(data, activeSection)

  return {
    reportTitle: CONTRACTOR_TITLE_MAP[activeSection],
    companyName: COMPANY,
    exportDate: todayLabel(),
    activeTab: CONTRACTOR_TAB_MAP[activeSection],
    activeFilters,
    kpis,
    tables,
  }
}

function buildContractorTabTables(
  data: ContractorReportsViewModel,
  section: ContractorSection,
): PdfExportPayload['tables'] {
  switch (section) {
    case 'overview':
      return [
        {
          title: 'ترتيب المقاولين',
          headers: ['المقاول', 'المشاريع', 'الإيرادات', 'المصروفات', 'الصافي', 'القيود'],
          rows: data.contractors.map((r) => [
            r.contractorName,
            r.projectCount,
            formatMoneyInteger(r.totalIncome),
            formatMoneyInteger(r.totalExpense),
            formatMoneyInteger(r.netMovement),
            r.entryCount,
          ]),
        },
      ]
    case 'statement':
      return [
        {
          title: 'كشف الحساب',
          headers: ['التاريخ', 'المقاول', 'المشروع', 'البند', 'النوع', 'طريقة الدفع', 'المبلغ'],
          rows: data.entries.map((r) => [
            r.entryDate,
            r.contractorName,
            r.projectName,
            r.category,
            r.entryType,
            r.paymentMethod,
            formatMoneyInteger(r.amount),
          ]),
        },
      ]
    case 'projects':
      return [
        {
          title: 'حسب المشروع',
          headers: ['المقاول', 'المشروع', 'الإيرادات', 'المصروفات', 'الصافي', 'القيود'],
          rows: data.contractorProjects.map((r) => [
            r.contractorName,
            r.projectName,
            formatMoneyInteger(r.totalIncome),
            formatMoneyInteger(r.totalExpense),
            formatMoneyInteger(r.netMovement),
            r.entryCount,
          ]),
        },
      ]
    case 'categories':
      return [
        {
          title: 'البنود',
          headers: ['المقاول', 'البند', 'المصروفات', 'القيود', 'النسبة'],
          rows: data.categories.map((r) => [
            r.contractorName,
            r.category,
            formatMoneyInteger(r.totalExpense),
            r.entryCount,
            `${r.percentageOfContractorExpense}%`,
          ]),
        },
      ]
    case 'monthly':
      return [
        {
          title: 'النشاط الشهري',
          headers: ['المقاول', 'الشهر', 'الإيرادات', 'المصروفات', 'الصافي', 'القيود'],
          rows: data.monthlyActivity.map((r) => [
            r.contractorName,
            r.monthKey,
            formatMoneyInteger(r.totalIncome),
            formatMoneyInteger(r.totalExpense),
            formatMoneyInteger(r.netMovement),
            r.entryCount,
          ]),
        },
      ]
    case 'payments':
      return [
        {
          title: 'طرق الدفع',
          headers: ['المقاول', 'طريقة الدفع', 'القيمة', 'القيود', 'النسبة'],
          rows: data.paymentMethods.map((r) => [
            r.contractorName,
            r.paymentMethod,
            formatMoneyInteger(r.totalAmount),
            r.entryCount,
            `${r.percentageOfContractorMovement}%`,
          ]),
        },
      ]
    case 'quality':
      return [
        {
          title: 'جودة البيانات',
          headers: ['الملاحظة', 'عدد القيود', 'إجمالي المبالغ'],
          rows: data.dataQuality.map((r) => [r.label, r.count, formatMoneyInteger(r.totalAmount)]),
        },
      ]
  }
}
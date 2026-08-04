import { normalizeEntryType, parseAmount } from '../../../shared/contractors-helpers'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import {
  findReportEntries,
  findReportJournalEntries,
  findReportProjects,
} from '../repositories/reports.repository'
import type {
  ExecutiveViewModel,
  JournalReportFilters,
  JournalReportViewModel,
  JournalSummary,
  ProjectsReportViewModel,
  ReportEntryRecord,
  ReportJournalEntryRecord,
  ReportJournalRow,
  ReportProjectRecord,
  ReportProjectRow,
  ReportsSummary,
  SmartInsight,
  TopProjectsResult,
} from '../types/report.types'

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseProgress(value: number | string | null): number {
  const n = parseAmount(value)
  return Math.min(100, Math.max(0, Math.round(n)))
}

function resolveProjectName(project: ReportJournalEntryRecord['project']): string {
  if (!project) return '—'
  if (Array.isArray(project)) return project[0]?.name ?? '—'
  return (project as { name: string }).name
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapReportProject(
  project: ReportProjectRecord,
  financials: { income: number; expense: number; entryCount: number },
): ReportProjectRow {
  const contractValue = parseAmount(project.contract_value)
  const net = financials.income - financials.expense

  return {
    id: project.id,
    name: project.name,
    code: project.code ?? '—',
    client: project.client_name ?? '—',
    status: project.status ?? 'unknown',
    progress: parseProgress(project.progress),
    contractValue,
    income: financials.income,
    expense: financials.expense,
    net,
    remaining: Math.max(0, contractValue - financials.income),
    entryCount: financials.entryCount,
    isArchived: project.is_archived === true,
  }
}

export function mapJournalEntry(record: ReportJournalEntryRecord): ReportJournalRow {
  const normalized = normalizeEntryType(record.entry_type)
  return {
    id: record.id,
    date: record.entry_date,
    dateFormatted: formatAccountingDate(record.entry_date),
    entryType: normalized ?? 'unknown',
    amount: parseAmount(record.amount),
    contractorName: record.contractor_name ?? '—',
    paymentMethod: record.payment_method ?? '—',
    projectId: record.project_id ?? '',
    projectName: resolveProjectName(record.project),
    description: record.description ?? '—',
  }
}

// ─── Project aggregation ──────────────────────────────────────────────────────

function buildFinancialsMap(
  entries: ReportEntryRecord[],
): Map<string, { income: number; expense: number; entryCount: number }> {
  const map = new Map<string, { income: number; expense: number; entryCount: number }>()

  for (const entry of entries) {
    const current = map.get(entry.project_id) ?? { income: 0, expense: 0, entryCount: 0 }
    const type = normalizeEntryType(entry.entry_type)
    const amount = parseAmount(entry.amount)

    if (type === 'income') current.income += amount
    if (type === 'expense') current.expense += amount
    current.entryCount += 1
    map.set(entry.project_id, current)
  }

  return map
}

export function buildProjectReportRows(
  projects: ReportProjectRecord[],
  entries: ReportEntryRecord[],
): ReportProjectRow[] {
  const financials = buildFinancialsMap(entries)

  return projects.map((project) => {
    const totals = financials.get(project.id) ?? { income: 0, expense: 0, entryCount: 0 }
    return mapReportProject(project, totals)
  })
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function buildExecutiveSummary(rows: ReportProjectRow[]): ReportsSummary {
  return rows.reduce<ReportsSummary>(
    (acc, row) => ({
      projectCount: acc.projectCount + 1,
      contractValue: acc.contractValue + row.contractValue,
      income: acc.income + row.income,
      expense: acc.expense + row.expense,
      net: acc.net + row.net,
      remaining: acc.remaining + row.remaining,
    }),
    { projectCount: 0, contractValue: 0, income: 0, expense: 0, net: 0, remaining: 0 },
  )
}

// Kept for backward-compat with existing tests
export function summarizeReportRows(rows: ReportProjectRow[]): ReportsSummary {
  return buildExecutiveSummary(rows)
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export function filterReportRows(
  rows: ReportProjectRow[],
  query: string,
  includeArchived: boolean,
): ReportProjectRow[] {
  const normalized = query.trim().toLocaleLowerCase('ar-EG')
  return rows.filter((row) => {
    if (!includeArchived && row.isArchived) return false
    if (!normalized) return true
    return [row.name, row.code, row.client].some((v) =>
      v.toLocaleLowerCase('ar-EG').includes(normalized),
    )
  })
}

// ─── Top Projects ─────────────────────────────────────────────────────────────

export function buildTopProjects(rows: ReportProjectRow[]): TopProjectsResult {
  const active = rows.filter((r) => !r.isArchived && r.entryCount > 0)

  const profitable = active
    .filter((r) => r.net > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, 5)

  const lossMaking = active
    .filter((r) => r.net < 0)
    .sort((a, b) => a.net - b.net)
    .slice(0, 5)

  return { profitable, lossMaking }
}

// ─── Executive ────────────────────────────────────────────────────────────────

export function buildExecutiveViewModel(
  projects: ReportProjectRecord[],
  entries: ReportEntryRecord[],
): ExecutiveViewModel {
  const rows = buildProjectReportRows(projects, entries)
  const summary = buildExecutiveSummary(rows)
  const topProjects = buildTopProjects(rows)
  return { summary, topProjects, rows }
}

// Also kept for backward-compat
export function buildReportsViewModel(
  projects: ReportProjectRecord[],
  entries: ReportEntryRecord[],
) {
  const rows = buildProjectReportRows(projects, entries)
  return { rows, summary: buildExecutiveSummary(rows) }
}

// ─── Projects report ──────────────────────────────────────────────────────────

export function buildProjectsReportViewModel(
  projects: ReportProjectRecord[],
  entries: ReportEntryRecord[],
): ProjectsReportViewModel {
  return { allRows: buildProjectReportRows(projects, entries) }
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export function buildJournalReportViewModel(
  records: ReportJournalEntryRecord[],
): JournalReportViewModel {
  const contractorSet = new Set<string>()
  const paymentSet = new Set<string>()
  const projectMap = new Map<string, string>()

  const allRows: ReportJournalRow[] = records.map((r) => {
    const row = mapJournalEntry(r)

    if (r.contractor_name) contractorSet.add(r.contractor_name)
    if (r.payment_method) paymentSet.add(r.payment_method)
    if (row.projectId && row.projectName !== '—') {
      projectMap.set(row.projectId, row.projectName)
    }

    return row
  })

  const projectOptions = Array.from(projectMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))

  return {
    allRows,
    contractors: Array.from(contractorSet).sort((a, b) => a.localeCompare(b, 'ar')),
    paymentMethods: Array.from(paymentSet).sort((a, b) => a.localeCompare(b, 'ar')),
    projectOptions,
  }
}

export function filterJournalRows(
  rows: ReportJournalRow[],
  filters: JournalReportFilters,
): ReportJournalRow[] {
  const q = filters.query.trim().toLocaleLowerCase('ar-EG')
  return rows.filter((row) => {
    if (filters.entryType !== 'all' && row.entryType !== filters.entryType) return false
    if (filters.projectId && row.projectId !== filters.projectId) return false
    if (filters.contractorName && row.contractorName !== filters.contractorName) return false
    if (filters.paymentMethod && row.paymentMethod !== filters.paymentMethod) return false
    if (filters.dateFrom && row.date < filters.dateFrom) return false
    if (filters.dateTo && row.date > filters.dateTo) return false
    if (q) {
      const hit = [row.description, row.contractorName, row.projectName].some((v) =>
        v.toLocaleLowerCase('ar-EG').includes(q),
      )
      if (!hit) return false
    }
    return true
  })
}

export function summarizeJournalRows(rows: ReportJournalRow[]): JournalSummary {
  return rows.reduce<JournalSummary>(
    (acc, row) => {
      if (row.entryType === 'income') acc.totalIncome += row.amount
      if (row.entryType === 'expense') acc.totalExpense += row.amount
      acc.netProfit = acc.totalIncome - acc.totalExpense
      acc.entryCount += 1
      return acc
    },
    { totalIncome: 0, totalExpense: 0, netProfit: 0, entryCount: 0 },
  )
}

// ─── Smart Insights ───────────────────────────────────────────────────────────

export function buildSmartInsights(rows: ReportProjectRow[]): SmartInsight[] {
  const insights: SmartInsight[] = []
  const active = rows.filter((r) => !r.isArchived && r.entryCount > 0)

  if (active.length === 0) {
    return [
      {
        id: 'no-data',
        severity: 'info',
        title: 'لا توجد بيانات كافية',
        detail: 'لم يتم تسجيل أي قيود على المشاريع النشطة بعد.',
      },
    ]
  }

  // Highest profit
  const topProfit = active.reduce((a, b) => (a.net > b.net ? a : b))
  if (topProfit.net > 0) {
    insights.push({
      id: 'top-profit',
      severity: 'success',
      title: `أعلى ربحية: ${topProfit.name}`,
      detail: `صافي الربح ${formatMoneyInteger(topProfit.net)}`,
    })
  }

  // Highest expense
  const topExpense = active.reduce((a, b) => (a.expense > b.expense ? a : b))
  if (topExpense.expense > 0) {
    insights.push({
      id: 'top-expense',
      severity: 'warning',
      title: `أعلى مصروفات: ${topExpense.name}`,
      detail: `إجمالي المصروفات ${formatMoneyInteger(topExpense.expense)}`,
    })
  }

  // Budget risk — expense > 80% of contract value
  for (const r of active) {
    if (r.contractValue > 0 && r.expense / r.contractValue > 0.8) {
      const pct = Math.round((r.expense / r.contractValue) * 100)
      insights.push({
        id: `budget-risk-${r.id}`,
        severity: 'danger',
        title: `خطر ميزانية: ${r.name}`,
        detail: `المصروفات بلغت ${pct}% من قيمة العقد.`,
      })
    }
  }

  // Loss projects
  for (const r of active) {
    if (r.net < 0) {
      insights.push({
        id: `loss-${r.id}`,
        severity: 'danger',
        title: `مشروع خاسر: ${r.name}`,
        detail: `الخسارة الحالية ${formatMoneyInteger(Math.abs(r.net))}`,
      })
    }
  }

  // Projects without entries
  const noActivity = rows.filter((r) => !r.isArchived && r.entryCount === 0)
  if (noActivity.length > 0) {
    insights.push({
      id: 'no-activity',
      severity: 'info',
      title: `${noActivity.length} مشروع بدون قيود`,
      detail: noActivity.map((r) => r.name).join(' — '),
    })
  }

  return insights
}

// ─── Async loaders (used by hooks only) ──────────────────────────────────────

export async function loadExecutiveData(): Promise<ExecutiveViewModel> {
  const [projects, entries] = await Promise.all([findReportProjects(), findReportEntries()])
  return buildExecutiveViewModel(projects, entries)
}

export async function loadProjectsReportData(): Promise<ProjectsReportViewModel> {
  const [projects, entries] = await Promise.all([findReportProjects(), findReportEntries()])
  return buildProjectsReportViewModel(projects, entries)
}

export async function loadJournalReportData(): Promise<JournalReportViewModel> {
  const records = await findReportJournalEntries()
  return buildJournalReportViewModel(records)
}

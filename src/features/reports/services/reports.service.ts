import { normalizeEntryType } from '../../../shared/contractors-helpers'
import {
  findReportEntries,
  findReportJournalEntries,
  findReportProjects,
} from '../repositories/reports.repository'
import type {
  AnalyticsViewModel,
  JournalReportFilters,
  JournalReportViewModel,
  JournalSummary,
  ReportEntryRecord,
  ReportJournalEntryRecord,
  ReportJournalRow,
  ReportProjectRecord,
  ReportProjectRow,
  ReportsSummary,
  ReportsViewModel,
  SmartInsight,
} from '../types/report.types'

// ─── Parsing helpers ──────────────────────────────────────────────────────────

function parseAmount(value: number | string | null): number {
  const amount = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function parseProgress(value: number | string | null): number {
  const progress = parseAmount(value)
  return Math.min(100, Math.max(0, Math.round(progress)))
}

// ─── Executive / Project summary ─────────────────────────────────────────────

export function summarizeReportRows(rows: ReportProjectRow[]): ReportsSummary {
  return rows.reduce<ReportsSummary>(
    (total, row) => ({
      projectCount: total.projectCount + 1,
      contractValue: total.contractValue + row.contractValue,
      income: total.income + row.income,
      expense: total.expense + row.expense,
      net: total.net + row.net,
      remaining: total.remaining + row.remaining,
    }),
    { projectCount: 0, contractValue: 0, income: 0, expense: 0, net: 0, remaining: 0 },
  )
}

export function filterReportRows(
  rows: ReportProjectRow[],
  query: string,
  includeArchived: boolean,
): ReportProjectRow[] {
  const normalized = query.trim().toLocaleLowerCase('ar-EG')
  return rows.filter((row) => {
    if (!includeArchived && row.isArchived) return false
    if (!normalized) return true
    return [row.name, row.code, row.client].some((value) =>
      value.toLocaleLowerCase('ar-EG').includes(normalized),
    )
  })
}

export function buildReportsViewModel(
  projects: ReportProjectRecord[],
  entries: ReportEntryRecord[],
): ReportsViewModel {
  const financials = new Map<string, { income: number; expense: number; entryCount: number }>()

  for (const entry of entries) {
    const current = financials.get(entry.project_id) ?? { income: 0, expense: 0, entryCount: 0 }
    const type = normalizeEntryType(entry.entry_type)
    const amount = parseAmount(entry.amount)

    if (type === 'income') current.income += amount
    if (type === 'expense') current.expense += amount
    current.entryCount += 1
    financials.set(entry.project_id, current)
  }

  const rows: ReportProjectRow[] = projects.map((project) => {
    const totals = financials.get(project.id) ?? { income: 0, expense: 0, entryCount: 0 }
    const contractValue = parseAmount(project.contract_value)
    const net = totals.income - totals.expense

    return {
      id: project.id,
      name: project.name,
      code: project.code ?? '—',
      client: project.client_name ?? '—',
      status: project.status ?? 'unknown',
      progress: parseProgress(project.progress),
      contractValue,
      income: totals.income,
      expense: totals.expense,
      net,
      remaining: Math.max(0, contractValue - totals.income),
      entryCount: totals.entryCount,
      isArchived: project.is_archived === true,
    }
  })

  return { rows, summary: summarizeReportRows(rows) }
}

export async function getReportsViewModel(): Promise<ReportsViewModel> {
  const [projects, entries] = await Promise.all([findReportProjects(), findReportEntries()])
  return buildReportsViewModel(projects, entries)
}

// ─── Journal report ───────────────────────────────────────────────────────────

function resolveProjectName(raw: ReportJournalEntryRecord['project_id'], project: unknown): string {
  if (!raw) return '—'
  if (typeof project === 'object' && project !== null && 'name' in project) {
    return String((project as { name: string }).name)
  }
  if (Array.isArray(project) && project.length > 0) {
    return String((project[0] as { name: string }).name)
  }
  return '—'
}

export function buildJournalReportViewModel(records: ReportJournalEntryRecord[]): JournalReportViewModel {
  const contractorSet = new Set<string>()
  const paymentSet = new Set<string>()

  const rows: ReportJournalRow[] = records.map((r) => {
    const normalized = normalizeEntryType(r.entry_type)
    const contractor = r.contractor ?? '—'
    const paymentMethod = r.payment_method ?? '—'

    if (r.contractor) contractorSet.add(r.contractor)
    if (r.payment_method) paymentSet.add(r.payment_method)

    return {
      id: r.id,
      date: r.entry_date,
      type: normalized ?? 'unknown',
      amount: parseAmount(r.amount),
      contractor,
      paymentMethod,
      projectId: r.project_id ?? '',
      projectName: resolveProjectName(r.project_id, (r as unknown as Record<string, unknown>).project),
      description: r.description ?? '—',
    }
  })

  const summary = rows.reduce<JournalSummary>(
    (acc, row) => {
      if (row.type === 'income') acc.totalIncome += row.amount
      if (row.type === 'expense') acc.totalExpense += row.amount
      acc.netProfit = acc.totalIncome - acc.totalExpense
      acc.entryCount += 1
      return acc
    },
    { totalIncome: 0, totalExpense: 0, netProfit: 0, entryCount: 0 },
  )

  return {
    rows,
    summary,
    contractors: Array.from(contractorSet).sort(),
    paymentMethods: Array.from(paymentSet).sort(),
  }
}

export function filterJournalRows(
  rows: ReportJournalRow[],
  filters: JournalReportFilters,
): ReportJournalRow[] {
  const q = filters.query.trim().toLocaleLowerCase('ar-EG')
  return rows.filter((row) => {
    if (filters.entryType !== 'all' && row.type !== filters.entryType) return false
    if (filters.projectId && row.projectId !== filters.projectId) return false
    if (filters.contractor && row.contractor !== filters.contractor) return false
    if (filters.paymentMethod && row.paymentMethod !== filters.paymentMethod) return false
    if (filters.dateFrom && row.date < filters.dateFrom) return false
    if (filters.dateTo && row.date > filters.dateTo) return false
    if (q) {
      const match = [row.description, row.contractor, row.projectName].some((v) =>
        v.toLocaleLowerCase('ar-EG').includes(q),
      )
      if (!match) return false
    }
    return true
  })
}

export async function getJournalReportViewModel(): Promise<JournalReportViewModel> {
  const records = await findReportJournalEntries()
  return buildJournalReportViewModel(records)
}

// ─── Smart Insights ───────────────────────────────────────────────────────────

export function buildSmartInsights(rows: ReportProjectRow[]): SmartInsight[] {
  const insights: SmartInsight[] = []
  const active = rows.filter((r) => !r.isArchived && r.entryCount > 0)

  if (active.length === 0) {
    insights.push({
      id: 'no-data',
      severity: 'info',
      title: 'لا توجد بيانات كافية',
      detail: 'لم يتم تسجيل أي قيود على المشاريع النشطة بعد.',
    })
    return insights
  }

  // Highest profit
  const topProfit = active.reduce((a, b) => (a.net > b.net ? a : b))
  if (topProfit.net > 0) {
    insights.push({
      id: 'top-profit',
      severity: 'success',
      title: `أعلى ربحية: ${topProfit.name}`,
      detail: `صافي الربح ${topProfit.net.toLocaleString('ar-EG')} ج.م`,
    })
  }

  // Highest expense
  const topExpense = active.reduce((a, b) => (a.expense > b.expense ? a : b))
  if (topExpense.expense > 0) {
    insights.push({
      id: 'top-expense',
      severity: 'warning',
      title: `أعلى مصروفات: ${topExpense.name}`,
      detail: `إجمالي المصروفات ${topExpense.expense.toLocaleString('ar-EG')} ج.م`,
    })
  }

  // Budget risk — expense > 80% of contract value
  const atRisk = active.filter((r) => r.contractValue > 0 && r.expense / r.contractValue > 0.8)
  for (const r of atRisk) {
    const pct = Math.round((r.expense / r.contractValue) * 100)
    insights.push({
      id: `budget-risk-${r.id}`,
      severity: 'danger',
      title: `خطر ميزانية: ${r.name}`,
      detail: `المصروفات بلغت ${pct}% من قيمة العقد.`,
    })
  }

  // Loss projects
  const lossProjects = active.filter((r) => r.net < 0)
  for (const r of lossProjects) {
    insights.push({
      id: `loss-${r.id}`,
      severity: 'danger',
      title: `مشروع خاسر: ${r.name}`,
      detail: `الخسارة الحالية ${Math.abs(r.net).toLocaleString('ar-EG')} ج.م`,
    })
  }

  // No entries at all (projects with zero entries)
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

export async function getAnalyticsViewModel(): Promise<AnalyticsViewModel> {
  const executive = await getReportsViewModel()
  const insights = buildSmartInsights(executive.rows)
  return { executive, insights }
}

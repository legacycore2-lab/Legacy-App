import {
  findAllProjectFinancialEntries,
  findProjectById,
  findProjectEntries,
  findProjects,
  subscribeToProjectChanges,
  type FinancialEntryRow,
  type ProjectEntryRecord,
} from '../repositories/projects.repository'
import type {
  DonutSegment,
  Project,
  ProjectAnalytics,
  ProjectDetails,
  ProjectDetailsViewModel,
  ProjectEntry,
  ProjectFinancialSummary,
  ProjectJournalViewModel,
  ProjectRow,
  ProjectsSummary,
} from '../types/project.types'
import { normalizeEntryType } from '../../../shared/contractors-helpers'
import { mapProject } from './project.mapper'

// ─── Financial totals helpers ─────────────────────────────────────────────────

/**
 * Thin wrapper around shared normalizeEntryType.
 * Kept as a named export so existing callers and tests don't break.
 * Behaviour: income/i→income, expense/e→expense, unknown/null→null.
 */
export function normalizeFinancialEntryType(raw: string | null | undefined): 'income' | 'expense' | null {
  return normalizeEntryType(raw)
}

/**
 * Parses a raw DB amount to a non-negative finite number.
 * Invalid, non-finite, or negative values → 0.
 */
export function parseFinancialAmount(raw: number | string | null | undefined): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

export type ProjectFinancialTotals = {
  received: number // income total from entries
  spent: number // expense total from entries
}

/**
 * Aggregates income and expense totals per project_id from raw entry rows.
 * Unknown entry types and invalid amounts are silently ignored.
 * Does not mutate input.
 */
export function buildProjectFinancialTotals(rows: FinancialEntryRow[]): Map<string, ProjectFinancialTotals> {
  const totals = new Map<string, ProjectFinancialTotals>()

  for (const row of rows) {
    if (!row.project_id) continue
    const type = normalizeFinancialEntryType(row.entry_type)
    if (!type) continue // unknown → ignored entirely
    const amount = parseFinancialAmount(row.amount)
    if (amount === 0) continue // invalid / negative → ignored

    const existing = totals.get(row.project_id) ?? { received: 0, spent: 0 }
    if (type === 'income') {
      totals.set(row.project_id, { ...existing, received: existing.received + amount })
    } else {
      totals.set(row.project_id, { ...existing, spent: existing.spent + amount })
    }
  }

  return totals
}

/**
 * Returns a new array of projects with received/spent overridden from
 * the computed financial totals map.
 * Projects with no entries get received = 0, spent = 0.
 * Never falls back to the static DB columns — they may be stale.
 * Does not mutate input.
 */
export function mergeProjectsWithFinancialTotals(
  projects: Project[],
  totals: Map<string, ProjectFinancialTotals>,
): Project[] {
  return projects.map((project) => {
    const t = totals.get(project.id) ?? { received: 0, spent: 0 }
    return { ...project, received: t.received, spent: t.spent }
  })
}

export async function getProjects(): Promise<Project[]> {
  const [records, financialEntries] = await Promise.all([findProjects(), findAllProjectFinancialEntries()])

  const projects = records.reduce<Project[]>((acc, record) => {
    try {
      acc.push(mapProject(record))
    } catch (error) {
      console.warn('Skipping invalid project record.', { recordId: record.id, error })
    }
    return acc
  }, [])

  const totals = buildProjectFinancialTotals(financialEntries)
  return mergeProjectsWithFinancialTotals(projects, totals)
}

export function summarizeProjects(projects: Project[]): ProjectsSummary {
  return projects.reduce<ProjectsSummary>(
    (summary, project) => ({
      total: summary.total + 1,
      active: summary.active + (project.status === 'active' ? 1 : 0),
      completed: summary.completed + (project.status === 'completed' ? 1 : 0),
      paused: summary.paused + (project.status === 'paused' ? 1 : 0),
      totalContracts: summary.totalContracts + project.contractValue,
      totalLiquidity: summary.totalLiquidity + project.received - project.spent,
    }),
    {
      total: 0,
      active: 0,
      completed: 0,
      paused: 0,
      totalContracts: 0,
      totalLiquidity: 0,
    },
  )
}

export function buildProjectRows(projects: Project[]): ProjectRow[] {
  return projects.map((project) => ({
    ...project,
    balance: project.received - project.spent,
  }))
}

export function watchProjects(onChange: () => void): () => void {
  return subscribeToProjectChanges(onChange)
}

function mapProjectEntry(record: ProjectEntryRecord): ProjectEntry {
  const amount = Number(record.amount)
  const normalised = normalizeEntryType(record.entry_type)

  return {
    id: record.id,
    seq: record.seq,
    entryDate: record.entry_date,
    // unknown/null entry_type → 'unknown'; never silently treated as expense
    type: normalised ?? 'unknown',
    category: record.category?.trim() ?? '',
    description: record.description?.trim() ?? '',
    contractor: record.contractor_name?.trim() ?? '',
    paymentMethod: record.payment_method?.trim() ?? '',
    amount: Number.isFinite(amount) ? amount : 0,
  }
}

function summarizeEntries(entries: ProjectEntry[]): ProjectFinancialSummary {
  return entries.reduce<ProjectFinancialSummary>(
    (summary, entry) => ({
      totalIncome: summary.totalIncome + (entry.type === 'income' ? entry.amount : 0),
      totalExpense: summary.totalExpense + (entry.type === 'expense' ? entry.amount : 0),
      // unknown entry_type: excluded from balance — does not shift it in either direction
      balance:
        summary.balance +
        (entry.type === 'income' ? entry.amount : entry.type === 'expense' ? -entry.amount : 0),
      entryCount: summary.entryCount + 1,
    }),
    { totalIncome: 0, totalExpense: 0, balance: 0, entryCount: 0 },
  )
}

function buildProjectAnalytics(entries: ProjectEntry[]): ProjectAnalytics {
  const categoryTotals = new Map<string, number>()

  entries.forEach((entry) => {
    if (entry.type !== 'expense') return

    const category = entry.category || 'غير مصنف'
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + entry.amount)
  })

  const topCategories = [...categoryTotals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4)
  const maxCategoryValue = Math.max(1, ...topCategories.map(([, value]) => value))

  return {
    recentEntries: [...entries]
      .sort((left, right) => right.entryDate.localeCompare(left.entryDate))
      .slice(0, 6),
    expenseCategories: topCategories.map(([label, value]) => ({
      label,
      value,
      percentage: (value / maxCategoryValue) * 100,
    })),
  }
}

export async function getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  const [record, entryRecords] = await Promise.all([
    findProjectById(projectId),
    findProjectEntries(projectId),
  ])

  if (!record) return null

  const project = mapProject(record)
  const entries = entryRecords.map(mapProjectEntry)

  return {
    project,
    entries,
    summary: summarizeEntries(entries),
    analytics: buildProjectAnalytics(entries),
  }
}

export function buildProjectDetailsViewModel(details: ProjectDetails): ProjectDetailsViewModel {
  const { project, summary, analytics } = details

  const progress = Math.min(100, Math.max(0, project.progress))
  const remaining = project.contractValue - summary.totalExpense
  const profitMargin = summary.totalIncome > 0 ? Math.round((summary.balance / summary.totalIncome) * 100) : 0

  const donutSegments: DonutSegment[] = analytics.expenseCategories.slice(0, 5).map((item, index) => ({
    label: item.label,
    percentage: item.percentage,
    cssVar: `var(--workspace-chart-${index + 1})`,
  }))

  const donutGradient =
    donutSegments.length > 0
      ? `conic-gradient(${donutSegments
          .map((seg, index) => {
            const before = donutSegments.slice(0, index).reduce((sum, s) => sum + s.percentage, 0)
            return `${seg.cssVar} ${before}% ${before + seg.percentage}%`
          })
          .join(', ')})`
      : 'var(--surface-soft)'

  return {
    project,
    summary,
    analytics,
    progress,
    remaining,
    profitMargin,
    donutSegments,
    donutGradient,
  }
}

// ─── Finance Tab helpers ──────────────────────────────────────────────────────

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

/**
 * Builds last-7-months cashflow bars from raw entries.
 * All aggregation lives here — no reduce() in Page components.
 *
 * Timezone safety: year and month are extracted by splitting the ISO date
 * string directly (YYYY-MM-DD[...]) — no Date object is constructed for
 * entry dates. new Date('YYYY-MM-DD').getMonth() is intentionally avoided
 * because the Date constructor treats date-only strings as UTC midnight,
 * which shifts to the previous calendar day (and month) in UTC+ timezones.
 * The window anchor uses getUTCFullYear/getUTCMonth for the same reason.
 */
export function buildMonthlyCashflow(
  entries: ProjectEntry[],
): import('../types/project.types').MonthlyCashflowBar[] {
  const nowUtc = new Date()
  const todayYear = nowUtc.getUTCFullYear()
  const todayMonth = nowUtc.getUTCMonth()

  const months: { year: number; month: number }[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const totalMonths = todayYear * 12 + todayMonth - offset
    months.push({ year: Math.floor(totalMonths / 12), month: totalMonths % 12 })
  }

  const incomeByMonth = new Map<string, number>()
  const expenseByMonth = new Map<string, number>()

  for (const entry of entries) {
    if (!entry.entryDate) continue
    const datePart = entry.entryDate.slice(0, 10)
    const parts = datePart.split('-')
    if (parts.length < 2) continue
    const year = Number(parts[0])
    const month = Number(parts[1]) - 1
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) continue
    const key = `${year}-${month}`
    if (entry.type === 'income') {
      incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + entry.amount)
    } else {
      expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + entry.amount)
    }
  }

  const rawBars = months.map(({ year, month }) => {
    const key = `${year}-${month}`
    return {
      label: ARABIC_MONTHS[month] ?? '',
      incomeAmount: incomeByMonth.get(key) ?? 0,
      expenseAmount: expenseByMonth.get(key) ?? 0,
    }
  })

  const maxValue = Math.max(1, ...rawBars.map((bar) => Math.max(bar.incomeAmount, bar.expenseAmount)))

  return rawBars.map((bar) => ({
    ...bar,
    incomeHeight: Math.round((bar.incomeAmount / maxValue) * 100),
    expenseHeight: Math.round((bar.expenseAmount / maxValue) * 100),
  }))
}

export function buildFinanceViewModel(
  details: ProjectDetails,
): import('../types/project.types').ProjectFinanceViewModel {
  const { project, entries, summary, analytics } = details

  const profitMargin = summary.totalIncome > 0 ? Math.round((summary.balance / summary.totalIncome) * 100) : 0

  const donutSegments: import('../types/project.types').DonutSegment[] = analytics.expenseCategories
    .slice(0, 5)
    .map((item, index) => ({
      label: item.label,
      percentage: item.percentage,
      cssVar: `var(--workspace-chart-${index + 1})`,
    }))

  const donutGradient =
    donutSegments.length > 0
      ? `conic-gradient(${donutSegments
          .map((seg, index) => {
            const before = donutSegments.slice(0, index).reduce((sum, segment) => sum + segment.percentage, 0)
            return `${seg.cssVar} ${before}% ${before + seg.percentage}%`
          })
          .join(', ')})`
      : 'var(--surface-soft)'

  const monthlyCashflow = buildMonthlyCashflow(entries)
  const hasActivity = monthlyCashflow.some((bar) => bar.incomeAmount > 0 || bar.expenseAmount > 0)
  const totalFlow = summary.totalIncome + summary.totalExpense
  const incomeSharePercentage = totalFlow > 0 ? Math.round((summary.totalIncome / totalFlow) * 100) : 0
  const expenseSharePercentage = totalFlow > 0 ? 100 - incomeSharePercentage : 0

  return {
    summary,
    monthlyCashflow,
    donutSegments,
    donutGradient,
    profitMargin,
    remaining: project.contractValue - summary.totalExpense,
    contractValue: project.contractValue,
    hasActivity,
    incomeSharePercentage,
    expenseSharePercentage,
  }
}

// ─── Journal Tab helpers ──────────────────────────────────────────────────────

export function buildProjectJournalViewModel(details: ProjectDetails): ProjectJournalViewModel {
  const entries = [...details.entries].sort((left, right) => {
    const dateOrder = right.entryDate.localeCompare(left.entryDate)
    if (dateOrder !== 0) return dateOrder
    return (right.seq ?? 0) - (left.seq ?? 0)
  })

  return {
    entries,
    summary: details.summary,
    hasEntries: entries.length > 0,
  }
}

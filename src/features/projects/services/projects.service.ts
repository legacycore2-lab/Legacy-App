import {
  findProjectById,
  findProjectEntries,
  findProjects,
  subscribeToProjectChanges,
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
  ProjectRow,
  ProjectsSummary,
} from '../types/project.types'
import { mapProject } from './project.mapper'

export async function getProjects(): Promise<Project[]> {
  const records = await findProjects()

  return records.reduce<Project[]>((projects, record) => {
    try {
      projects.push(mapProject(record))
    } catch (error) {
      console.warn('Skipping invalid project record.', {
        recordId: record.id,
        error,
      })
    }

    return projects
  }, [])
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

  return {
    id: record.id,
    seq: record.seq,
    entryDate: record.entry_date,
    type: record.entry_type === 'income' ? 'income' : 'expense',
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
      balance: summary.balance + (entry.type === 'income' ? entry.amount : -entry.amount),
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
 */
export function buildMonthlyCashflow(
  entries: ProjectEntry[],
): import('../types/project.types').MonthlyCashflowBar[] {
  // Build the 7-month window (oldest → newest)
  const today = new Date()
  const months: { year: number; month: number }[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth() - offset, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() })
  }

  // Aggregate entries per month
  const incomeByMonth = new Map<string, number>()
  const expenseByMonth = new Map<string, number>()

  for (const entry of entries) {
    if (!entry.entryDate) continue
    const d = new Date(entry.entryDate)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (entry.type === 'income') {
      incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + entry.amount)
    } else {
      expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + entry.amount)
    }
  }

  // Build raw bars
  const rawBars = months.map(({ year, month }) => {
    const key = `${year}-${month}`
    return {
      label: ARABIC_MONTHS[month] ?? '',
      incomeAmount: incomeByMonth.get(key) ?? 0,
      expenseAmount: expenseByMonth.get(key) ?? 0,
    }
  })

  // Normalise heights to 0–100 relative to max value
  const maxValue = Math.max(1, ...rawBars.map((b) => Math.max(b.incomeAmount, b.expenseAmount)))

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
            const before = donutSegments.slice(0, index).reduce((sum, s) => sum + s.percentage, 0)
            return `${seg.cssVar} ${before}% ${before + seg.percentage}%`
          })
          .join(', ')})`
      : 'var(--surface-soft)'

  const monthlyCashflow = buildMonthlyCashflow(entries)
  const hasActivity = monthlyCashflow.some((b) => b.incomeAmount > 0 || b.expenseAmount > 0)
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

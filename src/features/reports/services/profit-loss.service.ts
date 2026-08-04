import { normalizeEntryType, parseAmount } from '../../../shared/contractors-helpers'
import { findReportEntries, findReportProjects } from '../repositories/reports.repository'
import type { ReportEntryRecord, ReportProjectRecord } from '../types/report.types'
import type {
  ProfitLossFilters,
  ProfitLossMonthlyRow,
  ProfitLossProjectRow,
  ProfitLossSummary,
  ProfitLossViewModel,
} from '../types/profit-loss.types'

function calculateMargin(income: number, net: number): number | null {
  if (income <= 0) return null
  return Math.round((net / income) * 10_000) / 100
}

export function filterProfitLossEntries(
  entries: ReportEntryRecord[],
  filters: ProfitLossFilters,
): ReportEntryRecord[] {
  return entries.filter((entry) => {
    if (filters.projectId && entry.project_id !== filters.projectId) return false
    if (filters.dateFrom && entry.entry_date < filters.dateFrom) return false
    if (filters.dateTo && entry.entry_date > filters.dateTo) return false
    return true
  })
}

export function buildProfitLossProjectRows(
  projects: ReportProjectRecord[],
  entries: ReportEntryRecord[],
): ProfitLossProjectRow[] {
  const totals = new Map<string, { income: number; expense: number; entryCount: number }>()

  for (const entry of entries) {
    const current = totals.get(entry.project_id) ?? { income: 0, expense: 0, entryCount: 0 }
    const type = normalizeEntryType(entry.entry_type)
    const amount = parseAmount(entry.amount)

    if (type === 'income') current.income += amount
    if (type === 'expense') current.expense += amount
    current.entryCount += 1
    totals.set(entry.project_id, current)
  }

  return projects
    .map((project) => {
      const total = totals.get(project.id) ?? { income: 0, expense: 0, entryCount: 0 }
      const net = total.income - total.expense
      return {
        projectId: project.id,
        projectName: project.name,
        contractValue: parseAmount(project.contract_value),
        income: total.income,
        expense: total.expense,
        net,
        marginPercent: calculateMargin(total.income, net),
        entryCount: total.entryCount,
      }
    })
    .filter((row) => row.entryCount > 0)
    .sort((a, b) => b.net - a.net)
}

export function buildProfitLossMonthlyRows(entries: ReportEntryRecord[]): ProfitLossMonthlyRow[] {
  const months = new Map<string, { income: number; expense: number }>()

  for (const entry of entries) {
    const monthKey = entry.entry_date.slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue

    const current = months.get(monthKey) ?? { income: 0, expense: 0 }
    const type = normalizeEntryType(entry.entry_type)
    const amount = parseAmount(entry.amount)

    if (type === 'income') current.income += amount
    if (type === 'expense') current.expense += amount
    months.set(monthKey, current)
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, totals]) => ({
      monthKey,
      monthLabel: monthKey,
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
    }))
}

export function summarizeProfitLoss(
  rows: ProfitLossProjectRow[],
  entryCount: number,
): ProfitLossSummary {
  const totals = rows.reduce(
    (acc, row) => ({
      totalIncome: acc.totalIncome + row.income,
      totalExpense: acc.totalExpense + row.expense,
    }),
    { totalIncome: 0, totalExpense: 0 },
  )
  const netProfit = totals.totalIncome - totals.totalExpense

  return {
    ...totals,
    netProfit,
    profitMarginPercent: calculateMargin(totals.totalIncome, netProfit),
    projectCount: rows.length,
    entryCount,
  }
}

export function buildProfitLossViewModel(
  projects: ReportProjectRecord[],
  entries: ReportEntryRecord[],
  filters: ProfitLossFilters,
): ProfitLossViewModel {
  const filteredEntries = filterProfitLossEntries(entries, filters)
  const scopedProjects = filters.projectId
    ? projects.filter((project) => project.id === filters.projectId)
    : projects
  const projectRows = buildProfitLossProjectRows(scopedProjects, filteredEntries)
  const monthlyRows = buildProfitLossMonthlyRows(filteredEntries)
  const summary = summarizeProfitLoss(projectRows, filteredEntries.length)
  const topProfitProject = projectRows.find((row) => row.net > 0) ?? null
  const topLossProject = [...projectRows].sort((a, b) => a.net - b.net).find((row) => row.net < 0) ?? null

  return {
    summary,
    projectRows,
    monthlyRows,
    projectOptions: projects
      .map((project) => ({ id: project.id, name: project.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
    topProfitProject,
    topLossProject,
  }
}

export async function loadProfitLossData(filters: ProfitLossFilters): Promise<ProfitLossViewModel> {
  const [projects, entries] = await Promise.all([findReportProjects(), findReportEntries()])
  return buildProfitLossViewModel(projects, entries, filters)
}

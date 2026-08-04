import { normalizeEntryType } from '../../../shared/contractors-helpers'
import { findReportEntries, findReportProjects } from '../repositories/reports.repository'
import type {
  ReportEntryRecord,
  ReportProjectRecord,
  ReportProjectRow,
  ReportsSummary,
  ReportsViewModel,
} from '../types/report.types'

function parseAmount(value: number | string | null): number {
  const amount = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function parseProgress(value: number | string | null): number {
  const progress = parseAmount(value)
  return Math.min(100, Math.max(0, Math.round(progress)))
}

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

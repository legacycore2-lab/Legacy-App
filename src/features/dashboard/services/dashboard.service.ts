import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, WalletCards } from 'lucide-react'
import { normalizeEntryType } from '../../../shared/contractors-helpers'
import { aggregateFinancialTotals, financialAmount } from '../../../shared/finance/amount'
import { dashboardActions } from '../data/dashboard.data'
import { findDashboardData, subscribeToDashboardChanges } from '../repositories/dashboard.repository'
import type {
  DashboardData,
  DashboardFinancialEntryRecord,
  DashboardProjectRecord,
  DashboardRecentEntryRecord,
} from '../types/dashboard.types'

const numberFormatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 })

function toAmount(value: number | string | null): number {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? financialAmount(amount) : 0
}

function toEffectiveAmount(entry: DashboardFinancialEntryRecord): number {
  const amount = toAmount(entry.amount)
  return entry.is_reversal ? -amount : amount
}

function toProgress(value: number | string | null): number {
  const progress = Number(value ?? 0)
  if (!Number.isFinite(progress)) return 0
  return Math.min(100, Math.max(0, Math.round(progress)))
}

function formatAmount(value: number): string {
  return numberFormatter.format(value)
}

function isActiveProject(project: DashboardProjectRecord): boolean {
  if (project.is_archived) return false
  return !project.status || project.status === 'active'
}

export function buildProjectBalances(entries: DashboardFinancialEntryRecord[]): Map<string, number> {
  const balances = new Map<string, number>()
  for (const entry of entries) {
    if (!entry.project_id) continue
    const type = normalizeEntryType(entry.type)
    if (!type) continue
    const amount = toEffectiveAmount(entry)
    const signedAmount = type === 'income' ? amount : -amount
    balances.set(entry.project_id, (balances.get(entry.project_id) ?? 0) + signedAmount)
  }
  return balances
}

export function buildDashboardTotals(entries: DashboardFinancialEntryRecord[]): {
  totalIncome: number
  totalExpense: number
} {
  const financialEntries = entries.flatMap((entry) => {
    const type = normalizeEntryType(entry.type)
    if (type !== 'income' && type !== 'expense') return []
    return [{ type, amount: toEffectiveAmount(entry) }]
  })
  const totals = aggregateFinancialTotals(financialEntries)
  return { totalIncome: totals.income, totalExpense: totals.expense }
}

function buildProjectNameMap(projects: DashboardProjectRecord[]): Map<string, string> {
  return new Map(projects.map((project) => [project.id, project.name]))
}

function formatEntryDate(value: string | null): string {
  return value?.trim() || 'بدون تاريخ'
}

function resolveProjectStatus(
  project: DashboardProjectRecord,
): 'active' | 'paused' | 'completed' | 'archived' {
  if (project.is_archived) return 'archived'
  const status = project.status ?? 'active'
  if (status === 'active' || status === 'paused' || status === 'completed' || status === 'archived')
    return status
  return 'active'
}

function mapRecentEntries(entries: DashboardRecentEntryRecord[], projectNames: Map<string, string>) {
  return entries.map((entry) => {
    const type = normalizeEntryType(entry.type)
    return {
      id: entry.seq ? `#${entry.seq}` : entry.id,
      project: entry.project_id ? (projectNames.get(entry.project_id) ?? 'مشروع غير معروف') : 'بدون مشروع',
      description: entry.description?.trim() || 'بدون بيان',
      date: formatEntryDate(entry.entry_date),
      amount: formatAmount(toAmount(entry.amount)),
      type: type ?? 'unknown',
    } as const
  })
}

export async function getDashboardData(): Promise<DashboardData> {
  const source = await findDashboardData()
  const projectBalances = buildProjectBalances(source.financialEntries)
  const projectNames = buildProjectNameMap(source.projects)
  const { totalIncome, totalExpense } = buildDashboardTotals(source.financialEntries)

  const balance = totalIncome - totalExpense
  const activeProjects = source.projects.filter(isActiveProject)
  const alertCount = activeProjects.filter((project) => (projectBalances.get(project.id) ?? 0) < 0).length

  return {
    header: {
      activeProjects: String(activeProjects.length),
      alerts: String(alertCount),
      balance: formatAmount(balance),
      lastUpdated: new Intl.DateTimeFormat('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date()),
    },
    kpis: [
      {
        label: 'إجمالي الرصيد',
        value: formatAmount(balance),
        trend: `${source.financialEntries.length} قيد`,
        icon: WalletCards,
        tone: balance >= 0 ? 'green' : 'gold',
        unit: 'ج.م',
      },
      {
        label: 'إجمالي الإيرادات',
        value: formatAmount(totalIncome),
        trend: 'من القيود الفعلية',
        icon: ArrowDownLeft,
        tone: 'green',
        unit: 'ج.م',
      },
      {
        label: 'إجمالي المصروفات',
        value: formatAmount(totalExpense),
        trend: 'من القيود الفعلية',
        icon: ArrowUpRight,
        tone: 'gold',
        unit: 'ج.م',
      },
      {
        label: 'المشاريع النشطة',
        value: String(activeProjects.length),
        trend: `${source.projects.length} مشروع إجمالًا`,
        icon: BriefcaseBusiness,
        tone: 'green',
      },
    ],
    projects: activeProjects.slice(0, 3).map((project) => ({
      id: project.id,
      name: project.name,
      client: project.client_name?.trim() || 'بدون عميل',
      balance: formatAmount(projectBalances.get(project.id) ?? 0),
      progress: toProgress(project.progress),
      status: resolveProjectStatus(project),
    })),
    entries: mapRecentEntries(source.recentEntries, projectNames),
    actions: dashboardActions,
  }
}

export function watchDashboard(onChange: () => void): () => void {
  return subscribeToDashboardChanges(onChange)
}

import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, WalletCards } from 'lucide-react'
import { dashboardActions } from '../data/dashboard.mock'
import { findDashboardData, subscribeToDashboardChanges } from '../repositories/dashboard.repository'
import type { DashboardData, DashboardEntryRecord, DashboardProjectRecord } from '../types/dashboard.types'

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

const projectStatusLabels: Record<string, string> = {
  active: 'جاري',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
}

function toAmount(value: number | string | null): number {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function toEffectiveAmount(entry: DashboardEntryRecord): number {
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

function normalizeEntryType(type: string | null): 'income' | 'expense' {
  return type === 'i' || type === 'income' ? 'income' : 'expense'
}

function isActiveProject(project: DashboardProjectRecord): boolean {
  if (project.is_archived) return false
  return !project.status || project.status === 'active'
}

function buildProjectBalances(entries: DashboardEntryRecord[]): Map<string, number> {
  return entries.reduce((balances, entry) => {
    if (!entry.project_id) return balances
    const amount = toEffectiveAmount(entry)
    const signedAmount = normalizeEntryType(entry.type) === 'income' ? amount : -amount
    balances.set(entry.project_id, (balances.get(entry.project_id) ?? 0) + signedAmount)
    return balances
  }, new Map<string, number>())
}

function buildProjectNameMap(projects: DashboardProjectRecord[]): Map<string, string> {
  return new Map(projects.map((project) => [project.id, project.name]))
}

function formatEntryDate(value: string | null): string {
  return value?.trim() || 'بدون تاريخ'
}

function formatProjectStatus(project: DashboardProjectRecord): string {
  if (project.is_archived) return projectStatusLabels.archived
  return projectStatusLabels[project.status ?? 'active'] ?? 'غير محدد'
}

export async function getDashboardData(): Promise<DashboardData> {
  const source = await findDashboardData()
  const projectBalances = buildProjectBalances(source.entries)
  const projectNames = buildProjectNameMap(source.projects)

  const totals = source.entries.reduce(
    (summary, entry) => {
      const amount = toEffectiveAmount(entry)
      if (normalizeEntryType(entry.type) === 'income') summary.income += amount
      else summary.expense += amount
      return summary
    },
    { income: 0, expense: 0 },
  )

  const balance = totals.income - totals.expense
  const activeProjects = source.projects.filter(isActiveProject)
  const alertCount = activeProjects.filter((project) => (projectBalances.get(project.id) ?? 0) < 0).length

  return {
    header: {
      activeProjects: String(activeProjects.length),
      alerts: String(alertCount),
      balance: formatAmount(balance),
      lastUpdated: 'الآن',
    },
    kpis: [
      {
        label: 'إجمالي الرصيد',
        value: formatAmount(balance),
        trend: `${source.entries.length} قيد`,
        icon: WalletCards,
        tone: balance >= 0 ? 'green' : 'gold',
      },
      {
        label: 'إجمالي الإيرادات',
        value: formatAmount(totals.income),
        trend: 'من القيود الفعلية',
        icon: ArrowDownLeft,
        tone: 'green',
      },
      {
        label: 'إجمالي المصروفات',
        value: formatAmount(totals.expense),
        trend: 'من القيود الفعلية',
        icon: ArrowUpRight,
        tone: 'gold',
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
      name: project.name,
      client: project.client_name?.trim() || 'بدون عميل',
      balance: formatAmount(projectBalances.get(project.id) ?? 0),
      progress: toProgress(project.progress),
      status: formatProjectStatus(project),
    })),
    entries: source.entries.slice(0, 3).map((entry) => ({
      id: entry.seq ? `#${entry.seq}` : entry.id,
      project: entry.project_id ? (projectNames.get(entry.project_id) ?? 'مشروع غير معروف') : 'بدون مشروع',
      description: entry.description?.trim() || 'بدون بيان',
      date: formatEntryDate(entry.entry_date),
      amount: formatAmount(toEffectiveAmount(entry)),
      type: normalizeEntryType(entry.type),
    })),
    actions: dashboardActions,
  }
}

export function watchDashboard(onChange: () => void): () => void {
  return subscribeToDashboardChanges(onChange)
}

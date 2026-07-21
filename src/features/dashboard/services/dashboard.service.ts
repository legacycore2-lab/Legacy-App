import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, WalletCards } from 'lucide-react'
import { dashboardActions } from '../data/dashboard.mock'
import { findDashboardData } from '../repositories/dashboard.repository'
import type {
  DashboardData,
  DashboardEntryRecord,
  DashboardProjectRecord,
} from '../types/dashboard.types'

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function toAmount(value: number | string | null): number {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatAmount(value: number): string {
  return numberFormatter.format(value)
}

function normalizeEntryType(type: string | null): 'income' | 'expense' {
  return type === 'i' || type === 'income' ? 'income' : 'expense'
}

function buildProjectBalances(entries: DashboardEntryRecord[]): Map<string, number> {
  return entries.reduce((balances, entry) => {
    if (!entry.project_id) return balances
    const amount = toAmount(entry.amount)
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

export async function getDashboardData(): Promise<DashboardData> {
  const source = await findDashboardData()
  const projectBalances = buildProjectBalances(source.entries)
  const projectNames = buildProjectNameMap(source.projects)

  const totals = source.entries.reduce(
    (summary, entry) => {
      const amount = toAmount(entry.amount)
      if (normalizeEntryType(entry.type) === 'income') summary.income += amount
      else summary.expense += amount
      return summary
    },
    { income: 0, expense: 0 },
  )

  const balance = totals.income - totals.expense
  const activeProjects = source.projects.filter((project) => !project.is_archived).length
  const alertCount = source.projects.filter((project) => (projectBalances.get(project.id) ?? 0) < 0).length

  return {
    header: {
      activeProjects: String(activeProjects),
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
        value: String(activeProjects),
        trend: `${source.projects.length} مشروع إجمالًا`,
        icon: BriefcaseBusiness,
        tone: 'green',
      },
    ],
    projects: source.projects
      .filter((project) => !project.is_archived)
      .slice(0, 3)
      .map((project) => ({
        name: project.name,
        client: '',
        balance: formatAmount(projectBalances.get(project.id) ?? 0),
        progress: 0,
        status: 'جاري',
      })),
    entries: source.entries.slice(0, 3).map((entry) => ({
      id: entry.seq ? `#${entry.seq}` : entry.id,
      project: entry.project_id ? (projectNames.get(entry.project_id) ?? 'مشروع غير معروف') : 'بدون مشروع',
      description: entry.description?.trim() || 'بدون بيان',
      date: formatEntryDate(entry.entry_date),
      amount: formatAmount(toAmount(entry.amount)),
      type: normalizeEntryType(entry.type),
    })),
    actions: dashboardActions,
  }
}

import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, WalletCards } from 'lucide-react'
import { normalizeEntryType } from '../../../shared/contractors-helpers'
import { dashboardActions } from '../data/dashboard.data'
import { findDashboardData, subscribeToDashboardChanges } from '../repositories/dashboard.repository'
import type { DashboardData, DashboardEntryRecord, DashboardProjectRecord } from '../types/dashboard.types'

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function toAmount(value: number | string | null): number {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
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

/**
 * Builds a signed balance per project from entries.
 * unknown entry_type → skipped (not treated as expense).
 */
function buildProjectBalances(entries: DashboardEntryRecord[]): Map<string, number> {
  const balances = new Map<string, number>()
  for (const entry of entries) {
    if (!entry.project_id) continue
    const type = normalizeEntryType(entry.type)
    if (!type) continue // unknown → skip entirely
    const amount = toAmount(entry.amount)
    const signedAmount = type === 'income' ? amount : -amount
    balances.set(entry.project_id, (balances.get(entry.project_id) ?? 0) + signedAmount)
  }
  return balances
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
  const s = project.status ?? 'active'
  if (s === 'active' || s === 'paused' || s === 'completed' || s === 'archived') return s
  return 'active'
}

export async function getDashboardData(): Promise<DashboardData> {
  const source = await findDashboardData()
  const projectBalances = buildProjectBalances(source.entries)
  const projectNames = buildProjectNameMap(source.projects)

  // Totals: unknown entry_type is excluded — never treated as expense
  let totalIncome = 0
  let totalExpense = 0
  for (const entry of source.entries) {
    const type = normalizeEntryType(entry.type)
    if (!type) continue
    const amount = toAmount(entry.amount)
    if (type === 'income') totalIncome += amount
    else totalExpense += amount
  }

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
        trend: `${source.entries.length} قيد`,
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
      name: project.name,
      client: project.client_name?.trim() || 'بدون عميل',
      balance: formatAmount(projectBalances.get(project.id) ?? 0),
      progress: toProgress(project.progress),
      status: resolveProjectStatus(project),
    })),
    entries: source.entries.slice(0, 3).map((entry) => {
      const type = normalizeEntryType(entry.type)
      return {
        id: entry.seq ? `#${entry.seq}` : entry.id,
        project: entry.project_id ? (projectNames.get(entry.project_id) ?? 'مشروع غير معروف') : 'بدون مشروع',
        description: entry.description?.trim() || 'بدون بيان',
        date: formatEntryDate(entry.entry_date),
        amount: formatAmount(toAmount(entry.amount)),
        // unknown entry_type shown as 'expense' for display only (visual neutral)
        type: type ?? 'expense',
      }
    }),
    actions: dashboardActions,
  }
}

export function watchDashboard(onChange: () => void): () => void {
  return subscribeToDashboardChanges(onChange)
}

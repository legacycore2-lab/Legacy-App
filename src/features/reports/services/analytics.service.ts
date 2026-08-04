import { normalizeEntryType } from '../../../shared/contractors-helpers'
import { formatMoneyInteger } from '../../../shared/formatters'
import { findAnalyticsEntries, findAnalyticsProjects } from '../repositories/analytics.repository'
import type {
  ExecutiveKPIs,
  JournalAnalyticsEntryRecord,
  JournalAnalyticsFilters,
  JournalAnalyticsRow,
  JournalAnalyticsTotals,
  JournalAnalyticsViewModel,
  ProjectHealthItem,
  SmartInsight,
} from '../types'
import type { ReportProjectRecord } from '../types/report.types'

// ─── helpers ──────────────────────────────────────────────────────────────

function parseNum(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function resolveProjectName(raw: unknown): string {
  if (!raw) return '—'
  if (Array.isArray(raw)) return (raw[0] as { name?: string })?.name ?? '—'
  return (raw as { name?: string })?.name ?? '—'
}

// ─── Executive KPIs ────────────────────────────────────────────────────────

export function buildExecutiveKPIs(
  projects: ReportProjectRecord[],
  entries: JournalAnalyticsEntryRecord[],
): ExecutiveKPIs {
  let totalIncome = 0
  let totalExpense = 0

  for (const e of entries) {
    const type = normalizeEntryType(e.entry_type)
    const amount = parseNum(e.amount)
    if (type === 'income') totalIncome += amount
    if (type === 'expense') totalExpense += amount
  }

  const totalContractValue = projects.reduce((s, p) => s + parseNum(p.contract_value), 0)
  const netProfit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
  const collectionRate = totalContractValue > 0 ? (totalIncome / totalContractValue) * 100 : 0

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active' && !p.is_archived).length,
    totalContractValue,
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin,
    collectionRate,
  }
}

// ─── Project Health ────────────────────────────────────────────────────────

export function buildProjectHealth(
  projects: ReportProjectRecord[],
  entries: JournalAnalyticsEntryRecord[],
): ProjectHealthItem[] {
  const map = new Map<string, { income: number; expense: number }>()

  for (const e of entries) {
    if (!e.project_id) continue
    const cur = map.get(e.project_id) ?? { income: 0, expense: 0 }
    const type = normalizeEntryType(e.entry_type)
    const amount = parseNum(e.amount)
    if (type === 'income') cur.income += amount
    if (type === 'expense') cur.expense += amount
    map.set(e.project_id, cur)
  }

  return projects
    .filter((p) => !p.is_archived)
    .map((p) => {
      const fin = map.get(p.id) ?? { income: 0, expense: 0 }
      const contractValue = parseNum(p.contract_value)
      const net = fin.income - fin.expense
      const profitMargin = fin.income > 0 ? (net / fin.income) * 100 : 0
      return {
        id: p.id,
        name: p.name,
        code: p.code ?? '—',
        status: p.status ?? 'unknown',
        progress: Math.min(100, Math.max(0, Math.round(parseNum(p.progress)))),
        contractValue,
        income: fin.income,
        expense: fin.expense,
        net,
        profitMargin,
        isArchived: p.is_archived === true,
      }
    })
    .sort((a, b) => b.net - a.net)
}

// ─── Journal Analytics ─────────────────────────────────────────────────────

export function buildJournalAnalyticsViewModel(
  entries: JournalAnalyticsEntryRecord[],
  filters: JournalAnalyticsFilters,
): JournalAnalyticsViewModel {
  const contractors = new Set<string>()
  const paymentMethods = new Set<string>()

  // collect all unique values for filter dropdowns
  for (const e of entries) {
    if (e.contractor_name?.trim()) contractors.add(e.contractor_name.trim())
    if (e.payment_method?.trim()) paymentMethods.add(e.payment_method.trim())
  }

  const normalizedQuery = filters.query.trim().toLocaleLowerCase('ar-EG')

  const rows: JournalAnalyticsRow[] = []

  for (const e of entries) {
    const type = normalizeEntryType(e.entry_type)
    const amount = parseNum(e.amount)

    // apply filters
    if (filters.entryType !== 'all') {
      if (filters.entryType === 'income' && type !== 'income') continue
      if (filters.entryType === 'expense' && type !== 'expense') continue
    }
    if (filters.contractor && (e.contractor_name ?? '') !== filters.contractor) continue
    if (filters.paymentMethod && (e.payment_method ?? '') !== filters.paymentMethod) continue

    const description = e.description ?? '—'
    const category = e.category ?? '—'
    const contractor = e.contractor_name ?? '—'
    const paymentMethod = e.payment_method ?? '—'
    const projectName = resolveProjectName((e as unknown as { project: unknown }).project)

    if (normalizedQuery) {
      const searchable = [description, category, contractor, paymentMethod, projectName]
        .join(' ')
        .toLocaleLowerCase('ar-EG')
      if (!searchable.includes(normalizedQuery)) continue
    }

    rows.push({
      id: e.id,
      entryNumber: parseNum(e.entry_number),
      date: e.entry_date,
      type: type ?? 'unknown',
      category,
      description,
      contractor,
      paymentMethod,
      amount,
      projectName,
      projectId: e.project_id ?? '',
    })
  }

  const totals: JournalAnalyticsTotals = {
    totalIncome: rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
    totalExpense: rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
    get netProfit() {
      return this.totalIncome - this.totalExpense
    },
    count: rows.length,
  }

  return {
    rows,
    totals,
    contractors: [...contractors].sort(),
    paymentMethods: [...paymentMethods].sort(),
  }
}

// ─── Smart Insights ────────────────────────────────────────────────────────

export function buildSmartInsights(
  health: ProjectHealthItem[],
  entries: JournalAnalyticsEntryRecord[],
): SmartInsight[] {
  const insights: SmartInsight[] = []

  if (health.length === 0) return insights

  // highest profit project
  const topProfit = health[0]
  if (topProfit.net > 0) {
    insights.push({
      id: 'top-profit',
      severity: 'success',
      title: 'أعلى مشروع ربحية',
      description: `${topProfit.name} حقق أعلى صافي ربح`,
      value: formatMoneyInteger(topProfit.net),
    })
  }

  // highest expense project
  const topExpense = [...health].sort((a, b) => b.expense - a.expense)[0]
  if (topExpense && topExpense.expense > 0) {
    insights.push({
      id: 'top-expense',
      severity: 'warning',
      title: 'أعلى مشروع في المصروفات',
      description: `${topExpense.name} يمثل أعلى إنفاق`,
      value: formatMoneyInteger(topExpense.expense),
    })
  }

  // budget risk: expense > 80% of contract value
  const budgetRisk = health.filter((p) => p.contractValue > 0 && p.expense / p.contractValue > 0.8)
  if (budgetRisk.length > 0) {
    insights.push({
      id: 'budget-risk',
      severity: 'danger',
      title: 'مشاريع في خطر الميزانية',
      description: `${budgetRisk.length} مشروع تجاوزت مصروفاتها ٨٠٪ من قيمة العقد`,
      value: `${budgetRisk.length} مشروع`,
    })
  }

  // no recent activity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentProjectIds = new Set(
    entries.filter((e) => new Date(e.entry_date) >= thirtyDaysAgo).map((e) => e.project_id),
  )
  const inactiveProjects = health.filter((p) => p.status === 'active' && !recentProjectIds.has(p.id))
  if (inactiveProjects.length > 0) {
    insights.push({
      id: 'no-activity',
      severity: 'info',
      title: 'مشاريع بدون نشاط حديث',
      description: `${inactiveProjects.length} مشروع نشط لم يُسجَّل له أي قيد خلال ٣٠ يومًا`,
      value: `${inactiveProjects.length} مشروع`,
    })
  }

  // loss projects
  const lossProjects = health.filter((p) => p.net < 0)
  if (lossProjects.length > 0) {
    insights.push({
      id: 'loss-projects',
      severity: 'danger',
      title: 'تحذير: مشاريع خاسرة',
      description: `${lossProjects.length} مشروع يُسجّل خسائر — مراجعة فورية مطلوبة`,
      value: `${lossProjects.length} مشروع`,
    })
  }

  return insights
}

// ─── Full analytics load ───────────────────────────────────────────────────

export type AnalyticsData = {
  kpis: ExecutiveKPIs
  health: ProjectHealthItem[]
  entries: JournalAnalyticsEntryRecord[]
  projects: ReportProjectRecord[]
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [projects, entries] = await Promise.all([findAnalyticsProjects(), findAnalyticsEntries()])

  const kpis = buildExecutiveKPIs(projects, entries)
  const health = buildProjectHealth(projects, entries)

  return { kpis, health, entries, projects }
}

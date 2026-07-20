import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  FolderPlus,
  ReceiptText,
  WalletCards,
} from 'lucide-react'
import { findDashboardData } from '../repositories/dashboard.repository'
import type {
  DashboardAction,
  DashboardData,
  DashboardEntryRecord,
  DashboardHeaderSummary,
  DashboardProjectRecord,
  DashboardSummaryRecord,
} from '../types/dashboard.types'

const currency = new Intl.NumberFormat('ar-EG')

const ACTIONS: DashboardAction[] = [
  { label: 'إضافة مشروع',  description: 'إنشاء مشروع جديد',  icon: FolderPlus },
  { label: 'إضافة قيد',    description: 'دخل أو مصروف',       icon: ReceiptText },
  { label: 'تسجيل عهدة',   description: 'إنشاء عهدة جديدة',   icon: BriefcaseBusiness },
  { label: 'تحويل مالي',   description: 'بين الخزنة والبنوك', icon: Banknote },
]

function formatAmount(value: number | string): string {
  return currency.format(Number(value))
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'جاري', paused: 'متوقف',
    completed: 'منتهي', archived: 'مؤرشف', open: 'جاري',
  }
  return map[status] ?? status
}

function projectName(project: DashboardEntryRecord['project']): string {
  if (Array.isArray(project)) return project[0]?.name ?? '—'
  return project?.name ?? '—'
}

function formatEntryDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('ar-EG', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

function buildKpis(summary: DashboardSummaryRecord) {
  const income  = Number(summary.total_income)
  const expense = Number(summary.total_expense)
  const balance = income - expense

  return [
    { label: 'إجمالي الرصيد',     value: formatAmount(balance),  trend: balance >= 0 ? '+' : '−', icon: WalletCards,     tone: 'green' as const },
    { label: 'إجمالي الإيرادات',  value: formatAmount(income),   trend: '+',                      icon: ArrowDownLeft,   tone: 'green' as const },
    { label: 'إجمالي المصروفات',  value: formatAmount(expense),  trend: '−',                      icon: ArrowUpRight,    tone: 'gold'  as const },
    { label: 'مشاريع نشطة',       value: String(summary.active_project_count), trend: '',          icon: BriefcaseBusiness, tone: 'green' as const },
  ]
}

function buildHeader(summary: DashboardSummaryRecord): DashboardHeaderSummary {
  const income  = Number(summary.total_income)
  const expense = Number(summary.total_expense)
  return {
    activeProjects: summary.active_project_count,
    balance:        formatAmount(income - expense),
    lastUpdated:    new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
  }
}

function buildProjects(records: DashboardProjectRecord[]) {
  return records.map((p) => ({
    name:     p.name,
    client:   p.client_name ?? '—',
    balance:  formatAmount(Number(p.received) - Number(p.spent)),
    progress: p.progress,
    status:   statusLabel(p.status),
  }))
}

function buildEntries(records: DashboardEntryRecord[]) {
  return records.map((e) => ({
    id:          `#${e.entry_number ?? '—'}`,
    project:     projectName(e.project),
    description: e.description ?? '—',
    date:        formatEntryDate(e.entry_date),
    amount:      formatAmount(e.amount),
    type:        (e.entry_type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
  }))
}

export async function getDashboardData(): Promise<DashboardData> {
  const raw = await findDashboardData()
  return {
    kpis:     buildKpis(raw.summary),
    header:   buildHeader(raw.summary),
    projects: buildProjects(raw.projects),
    entries:  buildEntries(raw.entries),
    actions:  ACTIONS,
  }
}

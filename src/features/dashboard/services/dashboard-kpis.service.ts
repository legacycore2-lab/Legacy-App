import { ArrowDownLeft, ArrowUpRight, FolderKanban, WalletCards } from 'lucide-react'
import type { DashboardKpiSource } from '../repositories/dashboard-kpis.repository'
import type { DashboardKpi } from '../types/dashboard.types'

const currency = new Intl.NumberFormat('ar-EG')

function toAmount(value: number | string | null): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function formatCurrency(value: number): string {
  return `${currency.format(value)} ج.م`
}

export function buildDashboardKpis(source: DashboardKpiSource): DashboardKpi[] {
  const totals = source.entries.reduce(
    (result, entry) => {
      const amount = toAmount(entry.amount)

      if (entry.type === 'i') result.income += amount
      if (entry.type === 'e') result.expense += amount

      return result
    },
    { income: 0, expense: 0 },
  )

  const balance = totals.income - totals.expense

  return [
    {
      label: 'إجمالي الرصيد',
      value: formatCurrency(balance),
      trend: 'بيانات مباشرة',
      icon: WalletCards,
      tone: balance >= 0 ? 'green' : 'gold',
    },
    {
      label: 'إجمالي الإيرادات',
      value: formatCurrency(totals.income),
      trend: 'بيانات مباشرة',
      icon: ArrowDownLeft,
      tone: 'green',
    },
    {
      label: 'إجمالي المصروفات',
      value: formatCurrency(totals.expense),
      trend: 'بيانات مباشرة',
      icon: ArrowUpRight,
      tone: 'gold',
    },
    {
      label: 'المشاريع النشطة',
      value: currency.format(source.activeProjectsCount),
      trend: 'غير مؤرشفة',
      icon: FolderKanban,
      tone: 'green',
    },
  ]
}

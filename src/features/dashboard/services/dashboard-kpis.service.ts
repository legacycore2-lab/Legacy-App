import { ArrowDownLeft, ArrowUpRight, FolderKanban, WalletCards } from 'lucide-react'
import type { DashboardKpiSource } from '../repositories/dashboard-kpis.repository'
import type { DashboardKpi } from '../types/dashboard.types'
import {
  formatDashboardCurrency,
  formatDashboardNumber,
  toDashboardAmount,
} from '../utils/dashboard-formatters'

export function buildDashboardKpis(source: DashboardKpiSource): DashboardKpi[] {
  const totals = source.entries.reduce(
    (result, entry) => {
      const amount = toDashboardAmount(entry.amount ?? null)

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
      value: formatDashboardCurrency(balance),
      trend: 'بيانات مباشرة',
      icon: WalletCards,
      tone: balance >= 0 ? 'green' : 'gold',
    },
    {
      label: 'إجمالي الإيرادات',
      value: formatDashboardCurrency(totals.income),
      trend: 'بيانات مباشرة',
      icon: ArrowDownLeft,
      tone: 'green',
    },
    {
      label: 'إجمالي المصروفات',
      value: formatDashboardCurrency(totals.expense),
      trend: 'بيانات مباشرة',
      icon: ArrowUpRight,
      tone: 'gold',
    },
    {
      label: 'المشاريع النشطة',
      value: formatDashboardNumber(source.activeProjectsCount),
      trend: 'غير مؤرشفة',
      icon: FolderKanban,
      tone: 'green',
    },
  ]
}

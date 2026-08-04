import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ReportsSummary } from '../types/report.types'

type Props = { summary: ReportsSummary; isLoading: boolean }

export function ExecutiveKpis({ summary, isLoading }: Props) {
  const kpis = [
    { label: 'إجمالي المشاريع', value: String(summary.projectCount), icon: null, cls: '' },
    { label: 'قيمة العقود', value: formatMoneyInteger(summary.contractValue), icon: Wallet, cls: '' },
    { label: 'الإيرادات', value: formatMoneyInteger(summary.income), icon: TrendingUp, cls: 'is-positive' },
    {
      label: 'المصروفات',
      value: formatMoneyInteger(summary.expense),
      icon: TrendingDown,
      cls: 'is-negative',
    },
    {
      label: 'صافي الربح',
      value: formatMoneyInteger(summary.net),
      icon: summary.net >= 0 ? TrendingUp : TrendingDown,
      cls: summary.net >= 0 ? 'is-positive' : 'is-negative',
    },
    { label: 'المتبقي من العقود', value: formatMoneyInteger(summary.remaining), icon: null, cls: '' },
  ]

  return (
    <section className="reports-kpis" aria-label="ملخص المؤشرات" aria-busy={isLoading}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <article key={kpi.label} className={kpi.cls}>
            <span>{kpi.label}</span>
            <strong>{isLoading ? '...' : kpi.value}</strong>
            {Icon ? <Icon size={18} aria-hidden="true" /> : null}
          </article>
        )
      })}
    </section>
  )
}

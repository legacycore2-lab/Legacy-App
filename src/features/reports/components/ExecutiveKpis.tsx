import { Banknote, Building2, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ReportsSummary } from '../types/report.types'

type Props = {
  summary: ReportsSummary
  isLoading: boolean
}

export function ExecutiveKpis({ summary, isLoading }: Props) {
  const items = [
    {
      label: 'إجمالي المشاريع',
      value: String(summary.projectCount),
      icon: Building2,
      cls: '',
    },
    {
      label: 'قيمة العقود',
      value: formatMoneyInteger(summary.contractValue),
      icon: Wallet,
      cls: '',
    },
    {
      label: 'الإيرادات',
      value: formatMoneyInteger(summary.income),
      icon: TrendingUp,
      cls: 'is-positive',
    },
    {
      label: 'المصروفات',
      value: formatMoneyInteger(summary.expense),
      icon: TrendingDown,
      cls: 'is-negative',
    },
    {
      label: 'صافي الحركة',
      value: formatMoneyInteger(summary.net),
      icon: summary.net >= 0 ? TrendingUp : TrendingDown,
      cls: summary.net >= 0 ? 'is-positive' : 'is-negative',
    },
    {
      label: 'المتبقي من العقود',
      value: formatMoneyInteger(summary.remaining),
      icon: Banknote,
      cls: '',
    },
  ]

  return (
    <div className="reports-kpis" aria-label="مؤشرات الأداء الرئيسية">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <article key={item.label} className={`reports-kpi-card${item.cls ? ` ${item.cls}` : ''}`}>
            <div className="reports-kpi-card__icon">
              <Icon size={18} aria-hidden="true" />
            </div>
            <span className="reports-kpi-card__label">{item.label}</span>
            <strong className="reports-kpi-card__value">{isLoading ? '...' : item.value}</strong>
          </article>
        )
      })}
    </div>
  )
}

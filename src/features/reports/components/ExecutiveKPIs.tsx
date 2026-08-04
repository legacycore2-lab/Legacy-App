import { Activity, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ExecutiveKPIs } from '../types'

type Props = { kpis: ExecutiveKPIs }

export function ExecutiveKPIsSection({ kpis }: Props) {
  const cards = [
    {
      label: 'إجمالي المشاريع',
      value: String(kpis.totalProjects),
      sub: `${kpis.activeProjects} نشط`,
      icon: Activity,
      color: 'blue',
    },
    {
      label: 'قيمة العقود',
      value: formatMoneyInteger(kpis.totalContractValue),
      sub: `تحصيل ${kpis.collectionRate.toFixed(1)}٪`,
      icon: DollarSign,
      color: 'purple',
    },
    {
      label: 'الإيرادات',
      value: formatMoneyInteger(kpis.totalIncome),
      sub: 'إجمالي المحصّل',
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'المصروفات',
      value: formatMoneyInteger(kpis.totalExpense),
      sub: 'إجمالي الإنفاق',
      icon: TrendingDown,
      color: 'red',
    },
    {
      label: 'صافي الربح',
      value: formatMoneyInteger(kpis.netProfit),
      sub: `هامش ${kpis.profitMargin.toFixed(1)}٪`,
      icon: TrendingUp,
      color: kpis.netProfit >= 0 ? 'green' : 'red',
    },
  ]

  return (
    <section className="an-kpis" aria-label="المؤشرات التنفيذية">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article key={card.label} className={`an-kpi-card is-${card.color}`}>
            <div className="an-kpi-card__icon">
              <Icon size={20} />
            </div>
            <div className="an-kpi-card__body">
              <span className="an-kpi-card__label">{card.label}</span>
              <strong className="an-kpi-card__value">{card.value}</strong>
              <small className="an-kpi-card__sub">{card.sub}</small>
            </div>
          </article>
        )
      })}
    </section>
  )
}

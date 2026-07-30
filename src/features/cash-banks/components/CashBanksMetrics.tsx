import { Banknote, Building2, Landmark, WalletCards } from 'lucide-react'
import type { CashBankMetric } from '../types/cash-banks.types'

export function CashBanksMetrics({ metrics }: { metrics: CashBankMetric[] }) {
  return (
    <div className="cash-banks-metrics">
      {metrics.map((metric) => (
        <article
          className={`cash-banks-metric cash-banks-tone--${metric.tone}`}
          key={metric.id}
        >
          <div className="cash-banks-metric__icon">
            {metric.id === 'liquidity' ? (
              <WalletCards />
            ) : metric.id === 'banks' ? (
              <Landmark />
            ) : metric.id === 'cash' ? (
              <Banknote />
            ) : (
              <Building2 />
            )}
          </div>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.change}</small>
        </article>
      ))}
    </div>
  )
}

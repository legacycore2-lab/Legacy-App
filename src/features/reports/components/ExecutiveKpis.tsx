import { Banknote, Building2, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ReportsSummary } from '../types/report.types'

type Props = {
  summary: ReportsSummary
  isLoading: boolean
}

// prettier-ignore
export function ExecutiveKpis({ summary, isLoading }: Props) {
  const v = (n: number) => (isLoading ? '...' : formatMoneyInteger(n))
  const isProfit = summary.net >= 0

  return (
    <div className="kpis-grid" aria-label="مؤشرات الأداء الرئيسية">
      {/* ── Hero row ── */}
      <article className="kpi-card kpi-hero kpi-income">
        <div className="kpi-card__header">
          <span className="kpi-card__label">الإيرادات</span>
          <div className="kpi-card__icon"><TrendingUp size={20} aria-hidden="true" /></div>
        </div>
        <strong className="kpi-card__value">{v(summary.income)}</strong>
        <div className="kpi-card__trend" aria-hidden="true" />
      </article>

      <article className="kpi-card kpi-hero kpi-expense">
        <div className="kpi-card__header">
          <span className="kpi-card__label">المصروفات</span>
          <div className="kpi-card__icon"><TrendingDown size={20} aria-hidden="true" /></div>
        </div>
        <strong className="kpi-card__value">{v(summary.expense)}</strong>
        <div className="kpi-card__trend" aria-hidden="true" />
      </article>

      <article className={`kpi-card kpi-hero ${isProfit ? 'kpi-profit' : 'kpi-loss'}`}>
        <div className="kpi-card__header">
          <span className="kpi-card__label">صافي الحركة</span>
          <div className="kpi-card__icon">
            {isProfit ? <TrendingUp size={20} aria-hidden="true" /> : <TrendingDown size={20} aria-hidden="true" />}
          </div>
        </div>
        <strong className="kpi-card__value">{v(summary.net)}</strong>
        <div className="kpi-card__trend" aria-hidden="true" />
      </article>

      {/* ── Secondary row ── */}
      <article className="kpi-card kpi-secondary">
        <div className="kpi-card__header">
          <span className="kpi-card__label">إجمالي المشاريع</span>
          <div className="kpi-card__icon"><Building2 size={16} aria-hidden="true" /></div>
        </div>
        <strong className="kpi-card__value kpi-value--sm">
          {isLoading ? '...' : String(summary.projectCount)}
        </strong>
      </article>

      <article className="kpi-card kpi-secondary">
        <div className="kpi-card__header">
          <span className="kpi-card__label">قيمة العقود</span>
          <div className="kpi-card__icon"><Wallet size={16} aria-hidden="true" /></div>
        </div>
        <strong className="kpi-card__value kpi-value--sm">{v(summary.contractValue)}</strong>
      </article>

      <article className="kpi-card kpi-secondary">
        <div className="kpi-card__header">
          <span className="kpi-card__label">المتبقي من العقود</span>
          <div className="kpi-card__icon"><Banknote size={16} aria-hidden="true" /></div>
        </div>
        <strong className="kpi-card__value kpi-value--sm">{v(summary.remaining)}</strong>
      </article>
    </div>
  )
}

import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type { InsightSeverity, SmartInsight } from '../types/report.types'

const ICON_MAP: Record<InsightSeverity, React.ElementType> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
}

const SEVERITY_LABEL: Record<InsightSeverity, string> = {
  success: 'ممتاز',
  info: 'معلومة',
  warning: 'تحذير',
  danger: 'خطر',
}

type Props = { insights: SmartInsight[]; isLoading: boolean }

export function SmartInsightsPanel({ insights, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="insights-grid">
        {[1, 2, 3].map((n) => (
          <div key={n} className="insight-card insight-card--skeleton" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <section className="reports-panel">
        <div className="reports-state">لا توجد تنبيهات أو رؤى حالياً.</div>
      </section>
    )
  }

  return (
    <div className="insights-grid">
      {insights.map((ins) => {
        const Icon = ICON_MAP[ins.severity]
        return (
          <article key={ins.id} className={`insight-card is-${ins.severity}`}>
            <div className="insight-card__top">
              <div className="insight-card__icon-wrap">
                <Icon size={20} aria-hidden="true" />
              </div>
              <span className="insight-card__severity">{SEVERITY_LABEL[ins.severity]}</span>
            </div>
            <div className="insight-card__body">
              <strong className="insight-card__title">{ins.title}</strong>
              <p className="insight-card__desc">{ins.detail}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

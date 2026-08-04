import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type { InsightSeverity, SmartInsight } from '../types/report.types'

const ICON_MAP: Record<InsightSeverity, React.ElementType> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
}

type Props = {
  insights: SmartInsight[]
  isLoading: boolean
}

export function SmartInsightsPanel({ insights, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="reports-panel">
        <div className="reports-state">جارٍ تحليل البيانات...</div>
      </section>
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
    <section className="reports-panel reports-insights-panel">
      <div className="reports-panel__heading">
        <div>
          <span className="reports-label">تحليل تلقائي</span>
          <h2>الرؤى والتنبيهات</h2>
        </div>
      </div>
      <ul className="reports-insights-list">
        {insights.map((ins) => {
          const Icon = ICON_MAP[ins.severity]
          return (
            <li key={ins.id} className={`reports-insight is-${ins.severity}`}>
              <Icon size={18} aria-hidden="true" />
              <div className="reports-insight__body">
                <strong>{ins.title}</strong>
                <span>{ins.detail}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

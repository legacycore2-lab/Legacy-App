import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type { InsightSeverity, SmartInsight } from '../types/report.types'

const ICONS: Record<InsightSeverity, React.ElementType> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
}

type Props = { insights: SmartInsight[]; isLoading: boolean }

export function SmartInsightsPanel({ insights, isLoading }: Props) {
  return (
    <section className="reports-panel reports-insights" aria-label="تنبيهات ذكية">
      <div className="reports-panel__heading">
        <div>
          <span>تحليل تلقائي</span>
          <h2>الرؤى الذكية</h2>
        </div>
      </div>

      {isLoading ? (
        <p className="reports-state">جارٍ تحليل البيانات...</p>
      ) : insights.length === 0 ? (
        <p className="reports-state">لا توجد تنبيهات حالياً.</p>
      ) : (
        <ul className="reports-insights__list">
          {insights.map((ins) => {
            const Icon = ICONS[ins.severity]
            return (
              <li key={ins.id} className={`reports-insight is-${ins.severity}`}>
                <Icon size={18} aria-hidden="true" />
                <div>
                  <strong>{ins.title}</strong>
                  <span>{ins.detail}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

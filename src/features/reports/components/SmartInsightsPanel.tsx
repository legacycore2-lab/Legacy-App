import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import type { InsightSeverity, SmartInsight } from '../types'

const ICON_MAP: Record<InsightSeverity, React.ElementType> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
}

type Props = { insights: SmartInsight[] }

export function SmartInsightsPanel({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <div className="an-panel">
        <h3 className="an-panel__title">الرؤى الذكية</h3>
        <p className="an-empty">لا توجد رؤى متاحة حالياً — أضف مشاريع وقيوداً للبدء.</p>
      </div>
    )
  }

  return (
    <div className="an-panel">
      <h3 className="an-panel__title">الرؤى الذكية</h3>
      <ul className="an-insights">
        {insights.map((insight) => {
          const Icon = ICON_MAP[insight.severity]
          return (
            <li key={insight.id} className={`an-insight is-${insight.severity}`}>
              <Icon size={20} />
              <div className="an-insight__body">
                <strong>{insight.title}</strong>
                <span>{insight.description}</span>
              </div>
              {insight.value ? <span className="an-insight__value">{insight.value}</span> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

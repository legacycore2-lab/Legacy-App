import { Activity, Award, Target, TrendingUp } from 'lucide-react'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ReportsSummary, TopProjectsResult } from '../types/report.types'

type Props = {
  summary: ReportsSummary
  topProjects: TopProjectsResult
}

// prettier-ignore
export function ExecutiveDashboard({ summary, topProjects }: Props) {
  const { profitable, lossMaking } = topProjects
  const profitPct =
    summary.income > 0 ? Math.round((summary.net / summary.income) * 100) : 0
  const executionPct =
    summary.contractValue > 0 ? Math.round((summary.income / summary.contractValue) * 100) : 0
  const expensePct =
    summary.income > 0 ? Math.round((summary.expense / summary.income) * 100) : 0

  return (
    <div className="exec-dashboard">
      {/* ── Left: Top/Loss lists ── */}
      <div className="exec-left">
        {profitable.length > 0 && (
          <section className="reports-panel exec-list-panel">
            <div className="reports-panel__heading">
              <div>
                <span className="reports-label">أعلى ربحية</span>
                <h2>أفضل المشاريع</h2>
              </div>
              <Award size={18} className="exec-panel-icon" aria-hidden="true" />
            </div>
            <ol className="exec-list">
              {profitable.map((row, i) => {
                const pct = Math.min(100, Math.round((row.net / (profitable[0]?.net || 1)) * 100))
                return (
                  <li key={row.id} className="exec-list__item">
                    <span className="exec-rank">{i + 1}</span>
                    <div className="exec-list__info">
                      <span className="exec-list__name">{row.name}</span>
                      <div className="exec-bar-wrap">
                        <div className="exec-bar is-profit" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="exec-list__val is-positive">{formatMoneyInteger(row.net)}</span>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {lossMaking.length > 0 && (
          <section className="reports-panel exec-list-panel">
            <div className="reports-panel__heading">
              <div>
                <span className="reports-label">تحتاج مراجعة</span>
                <h2>المشاريع الخاسرة</h2>
              </div>
            </div>
            <ol className="exec-list">
              {lossMaking.map((row, i) => {
                const pct = Math.min(100, Math.round((Math.abs(row.net) / (Math.abs(lossMaking[0]?.net) || 1)) * 100))
                return (
                  <li key={row.id} className="exec-list__item">
                    <span className="exec-rank is-loss">{i + 1}</span>
                    <div className="exec-list__info">
                      <span className="exec-list__name">{row.name}</span>
                      <div className="exec-bar-wrap">
                        <div className="exec-bar is-loss" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="exec-list__val is-negative">{formatMoneyInteger(row.net)}</span>
                  </li>
                )
              })}
            </ol>
          </section>
        )}
      </div>

      {/* ── Right: Summary cards ── */}
      <div className="exec-right">
        <section className="exec-summary-card">
          <div className="exec-summary-card__icon"><Target size={20} /></div>
          <div className="exec-summary-card__body">
            <span className="exec-summary-card__label">صحة العقود</span>
            <strong className="exec-summary-card__value">{executionPct}%</strong>
            <span className="exec-summary-card__sub">
              {formatMoneyInteger(summary.income)} من {formatMoneyInteger(summary.contractValue)}
            </span>
            <div className="exec-progress-track">
              <div className="exec-progress-fill" style={{ width: `${Math.min(100, executionPct)}%` }} />
            </div>
          </div>
        </section>

        <section className="exec-summary-card">
          <div className="exec-summary-card__icon is-profit"><TrendingUp size={20} /></div>
          <div className="exec-summary-card__body">
            <span className="exec-summary-card__label">ملخص الربحية</span>
            <strong className={`exec-summary-card__value ${profitPct >= 0 ? 'is-positive' : 'is-negative'}`}>
              {profitPct >= 0 ? '+' : ''}{profitPct}%
            </strong>
            <span className="exec-summary-card__sub">
              صافي {formatMoneyInteger(summary.net)}
            </span>
            <div className="exec-progress-track">
              <div
                className={`exec-progress-fill ${profitPct >= 0 ? 'is-profit' : 'is-loss'}`}
                style={{ width: `${Math.min(100, Math.abs(profitPct))}%` }}
              />
            </div>
          </div>
        </section>

        <section className="exec-summary-card">
          <div className="exec-summary-card__icon is-expense"><Activity size={20} /></div>
          <div className="exec-summary-card__body">
            <span className="exec-summary-card__label">ملخص التنفيذ</span>
            <strong className="exec-summary-card__value">{expensePct}%</strong>
            <span className="exec-summary-card__sub">
              المصروفات من الإيرادات
            </span>
            <div className="exec-progress-track">
              <div
                className={`exec-progress-fill ${expensePct > 80 ? 'is-loss' : 'is-profit'}`}
                style={{ width: `${Math.min(100, expensePct)}%` }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

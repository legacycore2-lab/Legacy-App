import type { ReactNode } from 'react'
import './erp-foundation.css'

/* ─── Types ────────────────────────────────────────────────────────────────── */

type BaseProps = {
  children: ReactNode
  className?: string
}

/* ─── ERPPage ──────────────────────────────────────────────────────────────── */

export function ERPPage({ children, className }: BaseProps) {
  return <div className={['erp-page', className].filter(Boolean).join(' ')}>{children}</div>
}

/* ─── ERPSection ───────────────────────────────────────────────────────────── */

export function ERPSection({ children, className }: BaseProps) {
  return <section className={['erp-section', className].filter(Boolean).join(' ')}>{children}</section>
}

type ERPSectionHeaderProps = {
  eyebrow?: string
  title: string
  actions?: ReactNode
}

export function ERPSectionHeader({ eyebrow, title, actions }: ERPSectionHeaderProps) {
  return (
    <div className="erp-section__header">
      <div className="erp-section__header-info">
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {actions}
    </div>
  )
}

export function ERPSectionBody({ children, className }: BaseProps) {
  return <div className={['erp-section__body', className].filter(Boolean).join(' ')}>{children}</div>
}

/* ─── ERPContent ───────────────────────────────────────────────────────────── */

export function ERPContent({ children, className }: BaseProps) {
  return <div className={['erp-content', className].filter(Boolean).join(' ')}>{children}</div>
}

/* ─── ERPGrid ──────────────────────────────────────────────────────────────── */

type ERPGridVariant = '2col' | '3col' | '4col' | 'auto'

type ERPGridProps = {
  children: ReactNode
  cols?: ERPGridVariant
  className?: string
}

export function ERPGrid({ children, cols = 'auto', className }: ERPGridProps) {
  return (
    <div className={['erp-grid', `erp-grid--${cols}`, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

/* ─── ERPCard ──────────────────────────────────────────────────────────────── */

export function ERPCard({ children, className }: BaseProps) {
  return <div className={['erp-card', className].filter(Boolean).join(' ')}>{children}</div>
}

/* ─── KPIGrid ──────────────────────────────────────────────────────────────── */

export function KPIGrid({ children, className }: BaseProps) {
  return <div className={['erp-kpi-grid', className].filter(Boolean).join(' ')}>{children}</div>
}

type KPICardProps = {
  icon: ReactNode
  label: string
  value: ReactNode
  iconClassName?: string
  className?: string
}

export function KPICard({ icon, label, value, iconClassName, className }: KPICardProps) {
  return (
    <article className={['erp-kpi-card', className].filter(Boolean).join(' ')}>
      <span className={['erp-kpi-card__icon', iconClassName].filter(Boolean).join(' ')}>{icon}</span>
      <div className="erp-kpi-card__body">
        <span className="erp-kpi-card__label">{label}</span>
        <strong className="erp-kpi-card__value">{value}</strong>
      </div>
    </article>
  )
}

/* ─── ERPTable ─────────────────────────────────────────────────────────────── */

export function ERPTableScroll({ children, className }: BaseProps) {
  return <div className={['erp-table-scroll', className].filter(Boolean).join(' ')}>{children}</div>
}

export function ERPTable({ children, className }: BaseProps) {
  return <table className={['erp-table', className].filter(Boolean).join(' ')}>{children}</table>
}

/* ─── ERPCurrency ──────────────────────────────────────────────────────────── */

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

type ERPCurrencyProps = {
  value: number
  className?: string
}

export function ERPCurrency({ value, className }: ERPCurrencyProps) {
  return (
    <bdi className={['erp-currency', className].filter(Boolean).join(' ')} dir="ltr">
      {moneyFormatter.format(value)}
    </bdi>
  )
}

/* ─── ERPBadge ─────────────────────────────────────────────────────────────── */

type ERPBadgeVariant = 'income' | 'expense' | 'success' | 'neutral' | 'gold'

type ERPBadgeProps = {
  children: ReactNode
  variant?: ERPBadgeVariant
  className?: string
}

export function ERPBadge({ children, variant = 'neutral', className }: ERPBadgeProps) {
  return (
    <span className={['erp-badge', `erp-badge--${variant}`, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}

/* ─── ERPEmpty ─────────────────────────────────────────────────────────────── */

type ERPEmptyProps = {
  icon?: ReactNode
  message: string
  className?: string
}

export function ERPEmpty({ icon, message, className }: ERPEmptyProps) {
  return (
    <div className={['erp-empty', className].filter(Boolean).join(' ')}>
      {icon}
      <p>{message}</p>
    </div>
  )
}

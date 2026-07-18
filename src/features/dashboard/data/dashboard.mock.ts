import {
  ArrowDownLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type KpiTone = 'green' | 'gold'

export type DashboardKpi = {
  label: string
  value: string
  trend: string
  icon: LucideIcon
  tone: KpiTone
}

export const dashboardKpis: DashboardKpi[] = [
  {
    label: 'إجمالي الرصيد',
    value: '2,458,750',
    trend: '+12.5%',
    icon: WalletCards,
    tone: 'green',
  },
  {
    label: 'إجمالي الإيرادات',
    value: '3,215,000',
    trend: '+18.7%',
    icon: ArrowDownLeft,
    tone: 'green',
  },
  {
    label: 'إجمالي المصروفات',
    value: '756,250',
    trend: '-4.3%',
    icon: ArrowUpRight,
    tone: 'gold',
  },
  {
    label: 'إجمالي العهد',
    value: '485,000',
    trend: '+6.2%',
    icon: BriefcaseBusiness,
    tone: 'green',
  },
]

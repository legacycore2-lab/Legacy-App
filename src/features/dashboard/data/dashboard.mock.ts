import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  FolderPlus,
  ReceiptText,
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

export type DashboardProject = {
  name: string
  client: string
  balance: string
  progress: number
  status: string
}

export type DashboardEntry = {
  id: string
  project: string
  description: string
  date: string
  amount: string
  type: 'income' | 'expense'
}

export type DashboardAction = {
  label: string
  description: string
  icon: LucideIcon
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

export const dashboardProjects: DashboardProject[] = [
  { name: 'هايد بارك', client: 'شركة ليجاسي', balance: '385,000', progress: 74, status: 'جاري' },
  { name: 'حمام سباحة التجمع', client: 'أحمد فؤاد', balance: '218,500', progress: 58, status: 'جاري' },
  { name: 'المكتب 50', client: 'Legacy Fine Touch', balance: '96,200', progress: 91, status: 'قارب على الانتهاء' },
]

export const dashboardEntries: DashboardEntry[] = [
  { id: '#1048', project: 'هايد بارك', description: 'دفعة أعمال محارة', date: '18 يوليو 2026', amount: '42,500', type: 'expense' },
  { id: '#1047', project: 'حمام سباحة التجمع', description: 'دفعة من العميل', date: '18 يوليو 2026', amount: '150,000', type: 'income' },
  { id: '#1046', project: 'المكتب 50', description: 'مشتريات كهرباء', date: '17 يوليو 2026', amount: '18,750', type: 'expense' },
]

export const dashboardActions: DashboardAction[] = [
  { label: 'إضافة مشروع', description: 'إنشاء مشروع جديد', icon: FolderPlus },
  { label: 'إضافة قيد', description: 'دخل أو مصروف', icon: ReceiptText },
  { label: 'تسجيل عهدة', description: 'إنشاء عهدة جديدة', icon: BriefcaseBusiness },
  { label: 'تحويل مالي', description: 'بين الخزنة والبنوك', icon: Banknote },
]

import {
  Banknote,
  BriefcaseBusiness,
  FileBarChart,
  Gauge,
  HandCoins,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { label: 'لوحة التحكم', path: '/', icon: Gauge },
  { label: 'المشاريع', path: '/projects', icon: BriefcaseBusiness },
  { label: 'الخزنة والبنوك', path: '/banks', icon: Banknote },
  { label: 'العهد', path: '/advances', icon: HandCoins },
  { label: 'التقارير', path: '/reports', icon: FileBarChart },
  { label: 'المستخدمون', path: '/users', icon: Users },
  { label: 'الإعدادات', path: '/settings', icon: Settings },
]

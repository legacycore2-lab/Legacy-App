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

export type NavigationSection = 'main' | 'finance' | 'management'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  section: NavigationSection
  keywords?: string[]
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'لوحة التحكم',
    path: '/',
    icon: Gauge,
    section: 'main',
    keywords: ['الرئيسية', 'dashboard'],
  },
  {
    label: 'المشاريع',
    path: '/projects',
    icon: BriefcaseBusiness,
    section: 'main',
    keywords: ['مشروع', 'projects'],
  },
  {
    label: 'الخزنة والبنوك',
    path: '/banks',
    icon: Banknote,
    section: 'finance',
    keywords: ['الخزنة', 'البنوك', 'تحويل', 'cash', 'banks'],
  },
  {
    label: 'العهد',
    path: '/advances',
    icon: HandCoins,
    section: 'finance',
    keywords: ['عهدة', 'سلف', 'advances'],
  },
  {
    label: 'التقارير',
    path: '/reports',
    icon: FileBarChart,
    section: 'management',
    keywords: ['تقرير', 'ارباح', 'خسائر', 'reports'],
  },
  {
    label: 'المستخدمون',
    path: '/users',
    icon: Users,
    section: 'management',
    keywords: ['مستخدم', 'صلاحيات', 'users'],
  },
  {
    label: 'الإعدادات',
    path: '/settings',
    icon: Settings,
    section: 'management',
    keywords: ['اعدادات', 'settings'],
  },
]

export const navigationSections: Array<{
  id: NavigationSection
  label: string
}> = [
  { id: 'main', label: 'الرئيسية' },
  { id: 'finance', label: 'العمليات المالية' },
  { id: 'management', label: 'الإدارة' },
]

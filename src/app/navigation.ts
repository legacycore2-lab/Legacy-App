import {
  Banknote,
  BookOpenCheck,
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
  eyebrow: string
  path: string
  icon: LucideIcon
  section: NavigationSection
  keywords?: string[]
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'لوحة التحكم',
    eyebrow: 'الرئيسية',
    path: '/',
    icon: Gauge,
    section: 'main',
    keywords: ['الرئيسية', 'dashboard'],
  },
  {
    label: 'المشاريع',
    eyebrow: 'إدارة المشاريع',
    path: '/projects',
    icon: BriefcaseBusiness,
    section: 'main',
    keywords: ['مشروع', 'projects'],
  },
  {
    label: 'القيود اليومية',
    eyebrow: 'العمليات المالية',
    path: '/journal',
    icon: BookOpenCheck,
    section: 'finance',
    keywords: ['قيد', 'قيود', 'يومية', 'مصروفات', 'إيرادات', 'journal'],
  },
  {
    label: 'الخزنة والبنوك',
    eyebrow: 'الحسابات المالية',
    path: '/banks',
    icon: Banknote,
    section: 'finance',
    keywords: ['الخزنة', 'البنوك', 'تحويل', 'cash', 'banks'],
  },
  {
    label: 'العهد',
    eyebrow: 'إدارة العهد',
    path: '/advances',
    icon: HandCoins,
    section: 'finance',
    keywords: ['عهدة', 'سلف', 'advances'],
  },
  {
    label: 'التقارير',
    eyebrow: 'التقارير والتحليلات',
    path: '/reports',
    icon: FileBarChart,
    section: 'management',
    keywords: ['تقرير', 'ارباح', 'خسائر', 'reports'],
  },
  {
    label: 'المستخدمون',
    eyebrow: 'الإدارة والصلاحيات',
    path: '/users',
    icon: Users,
    section: 'management',
    keywords: ['مستخدم', 'صلاحيات', 'users'],
  },
  {
    label: 'الإعدادات',
    eyebrow: 'إعدادات النظام',
    path: '/settings',
    icon: Settings,
    section: 'management',
    keywords: ['اعدادات', 'settings'],
  },
]

export function getNavigationItem(pathname: string): NavigationItem {
  return navigationItems.find((item) => item.path === pathname) ?? navigationItems[0]
}

export const navigationSections: Array<{
  id: NavigationSection
  label: string
}> = [
  { id: 'main', label: 'الرئيسية' },
  { id: 'finance', label: 'العمليات المالية' },
  { id: 'management', label: 'الإدارة' },
]

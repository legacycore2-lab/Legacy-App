import { Banknote, BriefcaseBusiness, FolderKanban, ReceiptText } from 'lucide-react'
import type { DashboardAction, DashboardEntry } from '../types/dashboard.types'

export const dashboardEntries: DashboardEntry[] = [
  {
    id: '#1048',
    project: 'هايد بارك',
    description: 'دفعة أعمال محارة',
    date: '18 يوليو 2026',
    amount: '42,500',
    type: 'expense',
  },
  {
    id: '#1047',
    project: 'حمام سباحة التجمع',
    description: 'دفعة من العميل',
    date: '18 يوليو 2026',
    amount: '150,000',
    type: 'income',
  },
  {
    id: '#1046',
    project: 'المكتب 50',
    description: 'مشتريات كهرباء',
    date: '17 يوليو 2026',
    amount: '18,750',
    type: 'expense',
  },
]

export const dashboardActions: DashboardAction[] = [
  { label: 'المشاريع', description: 'عرض وإدارة المشاريع', path: '/projects', icon: FolderKanban },
  { label: 'القيود اليومية', description: 'تسجيل ومراجعة القيود', path: '/journal', icon: ReceiptText },
  { label: 'العهد', description: 'متابعة العهد المالية', path: '/advances', icon: BriefcaseBusiness },
  { label: 'الخزنة والبنوك', description: 'الحسابات والتحويلات', path: '/banks', icon: Banknote },
]

import { Banknote, BriefcaseBusiness, FolderKanban, ReceiptText } from 'lucide-react'
import type { DashboardAction } from '../types/dashboard.types'

export const dashboardActions: DashboardAction[] = [
  { label: 'المشاريع', description: 'عرض وإدارة المشاريع', path: '/projects', icon: FolderKanban },
  { label: 'القيود اليومية', description: 'تسجيل ومراجعة القيود', path: '/journal', icon: ReceiptText },
  { label: 'العهد', description: 'متابعة العهد المالية', path: '/advances', icon: BriefcaseBusiness },
  { label: 'الخزنة والبنوك', description: 'الحسابات والتحويلات', path: '/banks', icon: Banknote },
]

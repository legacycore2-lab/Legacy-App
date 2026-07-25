import {
  Banknote,
  BriefcaseBusiness,
  FolderPlus,
  ReceiptText,
} from 'lucide-react'
import type { DashboardAction } from '../types/dashboard.types'

export const dashboardActions: DashboardAction[] = [
  { label: 'إضافة مشروع', description: 'إنشاء مشروع جديد', icon: FolderPlus },
  { label: 'إضافة قيد', description: 'دخل أو مصروف', icon: ReceiptText },
  { label: 'تسجيل عهدة', description: 'إنشاء عهدة جديدة', icon: BriefcaseBusiness },
  { label: 'تحويل مالي', description: 'بين الخزنة والبنوك', icon: Banknote },
]

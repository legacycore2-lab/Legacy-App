import { Banknote, BriefcaseBusiness, FolderPlus, ReceiptText } from 'lucide-react'

export const dashboardProjects = [
  { name: 'هايد بارك', client: 'شركة ليجاسي', balance: '385,000', progress: 74, status: 'جاري' },
  { name: 'حمام سباحة التجمع', client: 'أحمد فؤاد', balance: '218,500', progress: 58, status: 'جاري' },
  { name: 'المكتب 50', client: 'Legacy Fine Touch', balance: '96,200', progress: 91, status: 'قارب على الانتهاء' },
]

export const dashboardEntries = [
  { id: '#1048', project: 'هايد بارك', description: 'دفعة أعمال محارة', date: '18 يوليو 2026', amount: '42,500', type: 'expense' },
  { id: '#1047', project: 'حمام سباحة التجمع', description: 'دفعة من العميل', date: '18 يوليو 2026', amount: '150,000', type: 'income' },
  { id: '#1046', project: 'المكتب 50', description: 'مشتريات كهرباء', date: '17 يوليو 2026', amount: '18,750', type: 'expense' },
]

export const dashboardActions = [
  { label: 'إضافة مشروع', description: 'إنشاء مشروع جديد', icon: FolderPlus },
  { label: 'إضافة قيد', description: 'دخل أو مصروف', icon: ReceiptText },
  { label: 'تسجيل عهدة', description: 'إنشاء عهدة جديدة', icon: BriefcaseBusiness },
  { label: 'تحويل مالي', description: 'بين الخزنة والبنوك', icon: Banknote },
]

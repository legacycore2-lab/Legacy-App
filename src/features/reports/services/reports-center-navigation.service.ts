import type {
  ReportCategoryDefinition,
  ReportDefinition,
} from '../types/reports-center.types'

const SIMPLE_REPORTS: ReportDefinition[] = [
  {
    key: 'journal',
    title: 'تقرير اليومية',
    description: 'عرض القيود اليومية بالتفصيل مع الفلاتر والبحث والطباعة والتصدير.',
    category: 'journal',
    availability: 'available',
    icon: 'journal',
    keywords: ['يومية', 'قيود', 'تفصيلي', 'حركات'],
  },
  {
    key: 'executive',
    title: 'الملخص الدوري',
    description: 'ملخص مالي دوري للإيرادات والمصروفات وصافي الأداء والمشاريع.',
    category: 'executive',
    availability: 'available',
    icon: 'chart',
    keywords: ['ملخص', 'دوري', 'إيرادات', 'مصروفات', 'صافي'],
  },
  {
    key: 'projects',
    title: 'تقرير المشاريع',
    description: 'عرض المشاريع وقيم العقود والإيرادات والمصروفات والصافي والمتبقي.',
    category: 'projects',
    availability: 'available',
    icon: 'projects',
    keywords: ['مشاريع', 'عقود', 'إيرادات', 'مصروفات'],
  },
  {
    key: 'contractor-statement',
    title: 'تقرير المقاول',
    description: 'كشف حركة المقاول ودفعاته ومشاريعه خلال الفترة المحددة.',
    category: 'contractors',
    availability: 'available',
    icon: 'contractors',
    keywords: ['مقاول', 'كشف حساب', 'دفعات', 'مشاريع'],
  },
]

const SIMPLE_CATEGORIES: ReportCategoryDefinition[] = [
  { key: 'all', label: 'الكل' },
  { key: 'journal', label: 'اليومية' },
  { key: 'executive', label: 'الملخص' },
  { key: 'projects', label: 'المشاريع' },
  { key: 'contractors', label: 'المقاول' },
]

export function getReportsCenterDefinitions(): ReportDefinition[] {
  return SIMPLE_REPORTS.map((report) => ({ ...report, keywords: [...report.keywords] }))
}

export function getReportsCenterCategories(): ReportCategoryDefinition[] {
  return SIMPLE_CATEGORIES.map((category) => ({ ...category }))
}

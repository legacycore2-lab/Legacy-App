import type {
  ReportCategory,
  ReportCategoryDefinition,
  ReportDefinition,
  ReportsCenterSection,
  ReportsCenterViewModel,
} from '../types/reports-center.types'

const CATEGORIES: ReportCategoryDefinition[] = [
  { key: 'all', label: 'الكل' },
  { key: 'executive', label: 'تنفيذي' },
  { key: 'projects', label: 'مشاريع' },
  { key: 'journal', label: 'قيود' },
  { key: 'contractors', label: 'مقاولون' },
  { key: 'financial', label: 'مالي' },
  { key: 'documents', label: 'مستندات' },
  { key: 'system', label: 'نظام' },
]

const SECTION_TITLES: Record<Exclude<ReportCategory, 'all'>, string> = {
  executive: 'التقارير التنفيذية',
  projects: 'تقارير المشاريع',
  journal: 'تقارير القيود',
  contractors: 'تقارير المقاولين',
  financial: 'التقارير المالية',
  documents: 'تقارير المستندات',
  system: 'تقارير النظام',
}

const REPORTS: ReportDefinition[] = [
  {
    key: 'executive',
    title: 'الملخص التنفيذي',
    description: 'نظرة إدارية شاملة على الإيرادات والمصروفات وأداء المشاريع.',
    category: 'executive',
    availability: 'available',
    icon: 'chart',
    keywords: ['ملخص', 'إدارة', 'مؤشرات', 'أرباح', 'مصروفات'],
  },
  {
    key: 'profit-loss',
    title: 'الأرباح والخسائر',
    description: 'تحليل الإيرادات والمصروفات وصافي الربح خلال فترة محددة.',
    category: 'executive',
    availability: 'coming-soon',
    icon: 'profit',
    keywords: ['p&l', 'ربح', 'خسارة', 'دخل'],
  },
  {
    key: 'monthly-performance',
    title: 'الأداء الشهري',
    description: 'مقارنة شهرية لحركة الإيرادات والمصروفات وصافي الأداء.',
    category: 'executive',
    availability: 'coming-soon',
    icon: 'chart',
    keywords: ['شهري', 'اتجاه', 'مقارنة'],
  },
  {
    key: 'period-comparison',
    title: 'مقارنة الفترات',
    description: 'مقارنة الأداء المالي بين فترتين أو أكثر.',
    category: 'executive',
    availability: 'coming-soon',
    icon: 'comparison',
    keywords: ['فترة', 'مقارنة', 'سنوي'],
  },
  {
    key: 'projects',
    title: 'تقرير المشاريع',
    description: 'عرض شامل للمشاريع وقيم العقود والإيرادات والمصروفات والصافي.',
    category: 'projects',
    availability: 'available',
    icon: 'projects',
    keywords: ['مشروع', 'عقد', 'إنجاز', 'تكلفة'],
  },
  {
    key: 'project-comparison',
    title: 'مقارنة المشاريع',
    description: 'مقارنة مالية وتشغيلية مباشرة بين جميع المشاريع.',
    category: 'projects',
    availability: 'available',
    icon: 'comparison',
    keywords: ['مقارنة', 'مشاريع', 'صافي', 'متبقي'],
  },
  {
    key: 'profitable-projects',
    title: 'المشاريع الأكثر ربحًا',
    description: 'ترتيب المشاريع ذات صافي الحركة الموجب من الأعلى إلى الأقل.',
    category: 'projects',
    availability: 'available',
    icon: 'profit',
    keywords: ['أفضل', 'ربحية', 'ناجح'],
  },
  {
    key: 'loss-making-projects',
    title: 'المشاريع الخاسرة',
    description: 'المشاريع التي تحتاج مراجعة بسبب صافي الحركة السالب.',
    category: 'projects',
    availability: 'available',
    icon: 'loss',
    keywords: ['خسارة', 'مراجعة', 'خطر'],
  },
  {
    key: 'stalled-projects',
    title: 'المشاريع المتوقفة',
    description: 'المشاريع التي لم تسجل نشاطًا خلال فترة المراجعة.',
    category: 'projects',
    availability: 'coming-soon',
    icon: 'projects',
    keywords: ['متوقف', 'بدون حركة', 'تعطل'],
  },
  {
    key: 'budget-actual',
    title: 'الميزانية مقابل الفعلي',
    description: 'مقارنة الميزانية المخططة بالمصروف الفعلي لكل مشروع.',
    category: 'projects',
    availability: 'coming-soon',
    icon: 'comparison',
    keywords: ['ميزانية', 'فعلي', 'انحراف'],
  },
  {
    key: 'journal',
    title: 'تقرير القيود اليومية',
    description: 'بحث وتصفية القيود حسب الفترة والمشروع والمقاول وطريقة الدفع.',
    category: 'journal',
    availability: 'available',
    icon: 'journal',
    keywords: ['قيود', 'يومية', 'مصروف', 'إيراد'],
  },
  {
    key: 'categories',
    title: 'تقرير البنود',
    description: 'تحليل المصروفات والإيرادات حسب البنود المحاسبية.',
    category: 'journal',
    availability: 'coming-soon',
    icon: 'categories',
    keywords: ['بند', 'فئة', 'تصنيف'],
  },
  {
    key: 'payment-methods',
    title: 'طرق الدفع',
    description: 'تحليل العمليات المسجلة حسب طريقة الدفع.',
    category: 'journal',
    availability: 'coming-soon',
    icon: 'payments',
    keywords: ['دفع', 'بنك', 'نقدي', 'تحويل'],
  },
  {
    key: 'contractor-statement',
    title: 'كشف حساب المقاول',
    description: 'حركة ومستحقات ومدفوعات كل مقاول عبر المشاريع.',
    category: 'contractors',
    availability: 'coming-soon',
    icon: 'contractors',
    keywords: ['مقاول', 'كشف حساب', 'مدفوعات'],
  },
  {
    key: 'contractor-dues',
    title: 'مستحقات المقاولين',
    description: 'المبالغ المستحقة لكل مقاول والتي لم تسدد بعد.',
    category: 'contractors',
    availability: 'coming-soon',
    icon: 'contractors',
    keywords: ['مستحقات', 'مقاول', 'التزام'],
  },
  {
    key: 'contractor-payments',
    title: 'المدفوعات حسب المقاول',
    description: 'تحليل جميع المدفوعات المسجلة لكل مقاول.',
    category: 'contractors',
    availability: 'coming-soon',
    icon: 'payments',
    keywords: ['مقاول', 'دفع', 'تحويل'],
  },
  {
    key: 'top-contractors',
    title: 'أعلى المقاولين تكلفة',
    description: 'ترتيب المقاولين حسب إجمالي التكلفة المسجلة.',
    category: 'contractors',
    availability: 'coming-soon',
    icon: 'contractors',
    keywords: ['مقاول', 'تكلفة', 'ترتيب'],
  },
  {
    key: 'cash-flow',
    title: 'التدفق النقدي',
    description: 'حركة السيولة الداخلة والخارجة عبر الفترات.',
    category: 'financial',
    availability: 'coming-soon',
    icon: 'cash-flow',
    keywords: ['سيولة', 'تدفق', 'نقدي'],
  },
  {
    key: 'cash-banks',
    title: 'الخزنة والبنوك',
    description: 'أرصدة وحركة حسابات الخزنة والبنوك.',
    category: 'financial',
    availability: 'coming-soon',
    icon: 'cash-flow',
    keywords: ['خزنة', 'بنك', 'رصيد'],
  },
  {
    key: 'contract-values',
    title: 'قيمة العقود',
    description: 'قيمة العقود والمحصّل والمتبقي لكل مشروع.',
    category: 'financial',
    availability: 'available',
    icon: 'contracts',
    keywords: ['عقد', 'تحصيل', 'متبقي'],
  },
  {
    key: 'income-expense',
    title: 'الإيرادات والمصروفات',
    description: 'ملخص مالي للإيرادات والمصروفات وصافي الحركة حسب المشروع.',
    category: 'financial',
    availability: 'available',
    icon: 'chart',
    keywords: ['إيراد', 'مصروف', 'صافي'],
  },
  {
    key: 'commitments',
    title: 'الالتزامات',
    description: 'الالتزامات المالية المفتوحة والمبالغ المستحقة.',
    category: 'financial',
    availability: 'coming-soon',
    icon: 'contracts',
    keywords: ['التزام', 'مستحق', 'دائن'],
  },
  {
    key: 'attachments',
    title: 'تقرير المرفقات',
    description: 'مراجعة المستندات والمرفقات المرتبطة بالقيود والمشاريع.',
    category: 'documents',
    availability: 'coming-soon',
    icon: 'attachments',
    keywords: ['مرفق', 'ملف', 'pdf', 'صورة'],
  },
  {
    key: 'entries-without-documents',
    title: 'قيود بدون مستند',
    description: 'تحديد القيود التي لا تحتوي على مرفقات داعمة.',
    category: 'documents',
    availability: 'coming-soon',
    icon: 'attachments',
    keywords: ['قيد', 'بدون مستند', 'مرفق'],
  },
  {
    key: 'projects-without-files',
    title: 'مشاريع بدون ملفات',
    description: 'المشاريع التي لم ترفع لها مستندات حتى الآن.',
    category: 'documents',
    availability: 'coming-soon',
    icon: 'attachments',
    keywords: ['مشروع', 'بدون ملفات', 'مستند'],
  },
  {
    key: 'audit-log',
    title: 'سجل العمليات',
    description: 'سجل التغييرات والإجراءات التي تمت داخل النظام.',
    category: 'system',
    availability: 'coming-soon',
    icon: 'audit',
    keywords: ['سجل', 'تدقيق', 'تغيير'],
  },
  {
    key: 'user-activity',
    title: 'نشاط المستخدمين',
    description: 'متابعة استخدام النظام والعمليات المسجلة لكل مستخدم.',
    category: 'system',
    availability: 'coming-soon',
    icon: 'audit',
    keywords: ['مستخدم', 'نشاط', 'دخول'],
  },
  {
    key: 'permissions',
    title: 'الصلاحيات',
    description: 'مراجعة أدوار وصلاحيات المستخدمين داخل النظام.',
    category: 'system',
    availability: 'coming-soon',
    icon: 'audit',
    keywords: ['صلاحيات', 'دور', 'وصول'],
  },
]

export function buildReportDefinitions(): ReportDefinition[] {
  return REPORTS.map((report) => ({ ...report, keywords: [...report.keywords] }))
}

export function filterReportDefinitions(
  reports: ReportDefinition[],
  query: string,
  category: ReportCategory,
): ReportDefinition[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('ar-EG')

  return reports.filter((report) => {
    if (category !== 'all' && report.category !== category) return false
    if (!normalizedQuery) return true

    return [report.title, report.description, ...report.keywords].some((value) =>
      value.toLocaleLowerCase('ar-EG').includes(normalizedQuery),
    )
  })
}

export function buildReportsCenterViewModel(reports: ReportDefinition[]): ReportsCenterViewModel {
  const sections: ReportsCenterSection[] = Object.entries(SECTION_TITLES)
    .map(([category, title]) => ({
      category: category as Exclude<ReportCategory, 'all'>,
      title,
      reports: reports.filter((report) => report.category === category),
    }))
    .filter((section) => section.reports.length > 0)

  return {
    categories: CATEGORIES.map((category) => ({ ...category })),
    sections,
    totalReports: reports.length,
    availableReports: reports.filter((report) => report.availability === 'available').length,
  }
}

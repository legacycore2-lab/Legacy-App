import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  FileArchive,
  FileBarChart,
  FileText,
  FolderKanban,
  Landmark,
  LockKeyhole,
  Paperclip,
  ReceiptText,
  Scale,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  ReportCategory,
  ReportDefinition,
  ReportIconKey,
  ReportKey,
  ReportsCenterSection,
} from '../types/reports-center.types'

const ICONS: Record<ReportIconKey, LucideIcon> = {
  chart: BarChart3,
  projects: FolderKanban,
  journal: ClipboardList,
  insights: ChartNoAxesCombined,
  comparison: Scale,
  profit: TrendingUp,
  loss: TrendingDown,
  categories: FileBarChart,
  payments: WalletCards,
  contracts: FileText,
  'cash-flow': CircleDollarSign,
  contractors: Users,
  attachments: Paperclip,
  audit: ShieldCheck,
}

const CATEGORY_ICONS: Record<Exclude<ReportCategory, 'all'>, LucideIcon> = {
  executive: ChartNoAxesCombined,
  projects: Building2,
  journal: ReceiptText,
  contractors: BriefcaseBusiness,
  financial: Landmark,
  documents: FileArchive,
  system: LockKeyhole,
}

type Props = {
  sections: ReportsCenterSection[]
  query: string
  selectedCategory: ReportCategory
  categories: { key: ReportCategory; label: string }[]
  totalReports: number
  availableReports: number
  onQueryChange: (value: string) => void
  onCategoryChange: (category: ReportCategory) => void
  onOpenReport: (key: ReportKey) => void
}

function ReportCard({ report, onOpen }: { report: ReportDefinition; onOpen: () => void }) {
  const Icon = ICONS[report.icon]
  const isAvailable = report.availability === 'available'

  return (
    <article className={`report-catalog-card${isAvailable ? '' : ' is-coming-soon'}`}>
      <div className="report-catalog-card__top">
        <span className="report-catalog-card__icon">
          <Icon size={20} aria-hidden />
        </span>
        <span className={`report-catalog-badge ${isAvailable ? 'is-available' : 'is-soon'}`}>
          {isAvailable ? 'متاح' : 'قريبًا'}
        </span>
      </div>

      <div className="report-catalog-card__body">
        <h3>{report.title}</h3>
        <p>{report.description}</p>
      </div>

      {isAvailable ? (
        <button type="button" className="report-catalog-card__action" onClick={onOpen}>
          فتح التقرير
          <span aria-hidden>←</span>
        </button>
      ) : (
        <div className="report-catalog-card__disabled" aria-label={`${report.title} قريبًا`}>
          سيتم تفعيله بعد اكتمال بياناته
        </div>
      )}
    </article>
  )
}

export function ReportsCenter({
  sections,
  query,
  selectedCategory,
  categories,
  totalReports,
  availableReports,
  onQueryChange,
  onCategoryChange,
  onOpenReport,
}: Props) {
  return (
    <div className="reports-center">
      <header className="reports-center-hero">
        <div>
          <span className="reports-center-hero__eyebrow">Legacy Core Intelligence</span>
          <h1>مركز التقارير</h1>
          <p>اختر التقرير الذي تريد مراجعته من كتالوج التقارير المالية والتشغيلية.</p>
        </div>
        <div className="reports-center-hero__stats" aria-label="ملخص التقارير">
          <span>
            <strong>{availableReports}</strong>
            تقارير متاحة
          </span>
          <span>
            <strong>{totalReports}</strong>
            إجمالي النتائج
          </span>
        </div>
      </header>

      <section className="reports-center-toolbar" aria-label="البحث وتصنيف التقارير">
        <label className="reports-center-search">
          <Search size={18} aria-hidden />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="ابحث باسم التقرير أو وصفه..."
          />
        </label>
        <div className="reports-center-categories" role="tablist" aria-label="فئات التقارير">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              role="tab"
              aria-selected={selectedCategory === category.key}
              className={selectedCategory === category.key ? 'is-active' : ''}
              onClick={() => onCategoryChange(category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      {sections.length === 0 ? (
        <div className="reports-center-empty">
          <CalendarRange size={28} aria-hidden />
          <h2>لا توجد تقارير مطابقة</h2>
          <p>جرّب تغيير كلمة البحث أو اختيار فئة أخرى.</p>
        </div>
      ) : (
        <div className="reports-center-sections">
          {sections.map((section) => {
            const SectionIcon = CATEGORY_ICONS[section.category]
            return (
              <section key={section.category} className="reports-center-section">
                <div className="reports-center-section__heading">
                  <span className="reports-center-section__icon">
                    <SectionIcon size={18} />
                  </span>
                  <div>
                    <h2>{section.title}</h2>
                    <span>{section.reports.length} تقرير</span>
                  </div>
                </div>
                <div className="reports-center-grid">
                  {section.reports.map((report) => (
                    <ReportCard key={report.key} report={report} onOpen={() => onOpenReport(report.key)} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

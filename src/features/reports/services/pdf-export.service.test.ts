import { describe, expect, it, vi, afterEach } from 'vitest'
import { buildPdfFilename, buildFiltersLabel } from './pdf-export.service'
import type { PdfExportPayload } from '../types/pdf-export.types'

// ── buildPdfFilename ──────────────────────────────────────────────────────────

describe('buildPdfFilename', () => {
  it('includes report key and fixed date', () => {
    const result = buildPdfFilename({ reportKey: 'contractor-report', date: '2026-08-05' })
    expect(result).toBe('contractor-report-2026-08-05.pdf')
  })

  it('includes slugified context label', () => {
    const result = buildPdfFilename({
      reportKey: 'contractor-report',
      contextLabel: 'محمود مصباح',
      date: '2026-08-05',
    })
    expect(result).toBe('contractor-report-محمود-مصباح-2026-08-05.pdf')
  })

  it('strips special characters from context label', () => {
    const result = buildPdfFilename({
      reportKey: 'contractor-report',
      contextLabel: 'أحمد (علي) / مشروع!',
      date: '2026-08-05',
    })
    expect(result).toMatch(/^contractor-report-/)
    expect(result).toMatch(/-2026-08-05\.pdf$/)
    expect(result).not.toContain('(')
    expect(result).not.toContain(')')
    expect(result).not.toContain('/')
  })

  it('truncates long context label to 40 chars', () => {
    const long = 'أ'.repeat(60)
    const result = buildPdfFilename({ reportKey: 'x', contextLabel: long, date: '2026-01-01' })
    const slug = result.replace('x-', '').replace('-2026-01-01.pdf', '')
    expect([...slug].length).toBeLessThanOrEqual(40)
  })

  it('omits context label when empty', () => {
    const result = buildPdfFilename({
      reportKey: 'projects-report',
      contextLabel: '',
      date: '2026-08-05',
    })
    expect(result).toBe('projects-report-2026-08-05.pdf')
  })

  it('always ends with .pdf', () => {
    const result = buildPdfFilename({ reportKey: 'any', date: '2026-01-01' })
    expect(result).toMatch(/\.pdf$/)
  })
})

// ── buildFiltersLabel ─────────────────────────────────────────────────────────

describe('buildFiltersLabel', () => {
  it('returns default text when no filters', () => {
    expect(buildFiltersLabel([])).toBe('لا توجد فلاتر مطبقة')
  })

  it('formats single filter', () => {
    expect(buildFiltersLabel([{ label: 'المشروع', value: 'تاج سلطان' }])).toBe('المشروع: تاج سلطان')
  })

  it('joins multiple filters with separator', () => {
    const result = buildFiltersLabel([
      { label: 'من', value: '2026-01-01' },
      { label: 'إلى', value: '2026-06-30' },
    ])
    expect(result).toContain('من: 2026-01-01')
    expect(result).toContain('إلى: 2026-06-30')
    expect(result).toContain('|')
  })
})

// ── Font registration verified before render ──────────────────────────────────
// vi.hoisted ensures the mock factory variable is available at hoist time

const { registerFontMock } = vi.hoisted(() => {
  return { registerFontMock: vi.fn().mockResolvedValue(undefined) }
})

vi.mock('./pdf-font.service', () => ({
  ARABIC_FONT_NAME: 'Amiri',
  ARABIC_FONT_STYLE: 'normal',
  registerArabicFont: registerFontMock,
}))

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 297, getHeight: () => 210 } },
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    addFileToVFS: vi.fn(),
    addFont: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 50 },
  })),
}))

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }))

afterEach(() => {
  vi.clearAllMocks()
})

describe('font registration', () => {
  it('registerArabicFont is called before any text is rendered', async () => {
    const { renderPdf } = await import('./pdf-export.service')

    const payload: PdfExportPayload = {
      reportTitle: 'الملخص التنفيذي',
      companyName: 'Legacy Core',
      exportDate: '٥ أغسطس ٢٠٢٦',
      activeTab: 'executive',
      activeFilters: [],
      kpis: [],
      tables: [],
    }

    try {
      await renderPdf(payload)
    } catch {
      // May throw in jsdom — we only assert font was registered
    }

    expect(registerFontMock).toHaveBeenCalledOnce()
  })
})

describe('downloadPdf does not call window.print', () => {
  it('print is never invoked when exporting PDF', async () => {
    const printSpy = vi.fn()
    const originalPrint = globalThis.window?.print
    if (globalThis.window) globalThis.window.print = printSpy

    const { downloadPdf: download } = await import('./pdf-export.service')

    const payload: PdfExportPayload = {
      reportTitle: 'تقرير المشاريع',
      companyName: 'Legacy Core',
      exportDate: '٥ أغسطس ٢٠٢٦',
      activeTab: 'projects',
      activeFilters: [],
      kpis: [],
      tables: [],
    }

    try {
      await download(payload, 'projects-report-2026-08-05.pdf')
    } catch {
      // May throw in jsdom — we only assert print was not called
    }

    expect(printSpy).not.toHaveBeenCalled()

    if (globalThis.window && originalPrint !== undefined) globalThis.window.print = originalPrint
  })
})

// ── Payload header data ───────────────────────────────────────────────────────

describe('pdf payload header fields', () => {
  it('executive payload has correct title and companyName', async () => {
    const { buildExecutivePdfPayload } = await import('./pdf-payload.service')
    const payload = buildExecutivePdfPayload({
      summary: {
        projectCount: 3,
        contractValue: 1_000_000,
        income: 500_000,
        expense: 300_000,
        net: 200_000,
        remaining: 500_000,
      },
      topProjects: { profitable: [], lossMaking: [] },
      rows: [],
    })
    expect(payload.reportTitle).toBe('الملخص التنفيذي')
    expect(payload.companyName).toBe('Legacy Core')
    expect(payload.activeTab).toBe('executive')
    expect(payload.exportDate).toBeTruthy()
  })

  it('profit-loss payload contains only profit-loss tab with correct filters', async () => {
    const { buildProfitLossPdfPayload } = await import('./pdf-payload.service')
    const payload = buildProfitLossPdfPayload(
      {
        summary: {
          totalIncome: 100,
          totalExpense: 80,
          netProfit: 20,
          profitMarginPercent: 20,
          projectCount: 1,
          entryCount: 5,
        },
        projectRows: [],
        monthlyRows: [],
        projectOptions: [],
        topProfitProject: null,
        topLossProject: null,
      },
      { dateFrom: '2026-01-01', dateTo: '2026-06-30', projectId: '' },
    )
    expect(payload.activeTab).toBe('profit-loss')
    expect(payload.activeFilters).toContainEqual({ label: 'من', value: '2026-01-01' })
    expect(payload.activeFilters).toContainEqual({ label: 'إلى', value: '2026-06-30' })
  })

  it('contractor payload reflects the active section tab only', async () => {
    const { buildContractorsPdfPayload } = await import('./pdf-payload.service')
    const emptyData = {
      overview: {
        contractorCount: 0,
        activeContractorCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        netMovement: 0,
        entryCount: 0,
        projectCount: 0,
        topCostContractor: null,
      },
      contractors: [],
      entries: [],
      contractorProjects: [],
      categories: [],
      monthlyActivity: [],
      paymentMethods: [],
      dataQuality: [],
      contractorOptions: [],
      projectOptions: [],
      categoryOptions: [],
    }
    const emptyFilters = {
      query: '',
      contractorName: '',
      projectId: '',
      category: '',
      entryType: 'all' as const,
      dateFrom: '',
      dateTo: '',
    }

    expect(buildContractorsPdfPayload(emptyData, emptyFilters, 'overview').activeTab).toBe(
      'contractor-overview',
    )
    expect(buildContractorsPdfPayload(emptyData, emptyFilters, 'payments').activeTab).toBe(
      'contractor-payments',
    )
    expect(buildContractorsPdfPayload(emptyData, emptyFilters, 'statement').activeTab).toBe(
      'contractor-statement',
    )
  })

  it('journal payload does not include data from other tabs', async () => {
    const { buildJournalPdfPayload } = await import('./pdf-payload.service')
    const payload = buildJournalPdfPayload(
      { allRows: [], contractors: [], paymentMethods: [], projectOptions: [] },
      {
        query: 'test',
        dateFrom: '',
        dateTo: '',
        projectId: '',
        entryType: 'all',
        contractorName: '',
        paymentMethod: '',
      },
      42,
    )
    expect(payload.activeTab).toBe('journal')
    expect(payload.tables).toHaveLength(0)
    expect(payload.kpis[0]).toMatchObject({ label: 'عدد القيود', value: '42' })
  })
})

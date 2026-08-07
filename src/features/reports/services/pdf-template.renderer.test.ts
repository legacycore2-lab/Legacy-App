import { describe, expect, it } from 'vitest'
import { COMPANY_NAME } from '../config/pdf-brand.config'
import {
  buildExecutivePdfPayload,
  buildProjectsPdfPayload,
  buildJournalPdfPayload,
  buildProfitLossPdfPayload,
  buildContractorsPdfPayload,
} from './pdf-payload.service'
import { buildFiltersLabel } from './pdf-export.service'

// ── Company name ──────────────────────────────────────────────────────────────

describe('COMPANY_NAME', () => {
  it('is LEGACY FINE TOUCH — not the app name', () => {
    expect(COMPANY_NAME).toBe('LEGACY FINE TOUCH')
    expect(COMPANY_NAME).not.toBe('Legacy Core')
    expect(COMPANY_NAME).not.toBe('legacy core')
  })

  it('is a non-empty string', () => {
    expect(typeof COMPANY_NAME).toBe('string')
    expect(COMPANY_NAME.length).toBeGreaterThan(0)
  })
})

// ── All payload builders use COMPANY_NAME ────────────────────────────────────

const minExecutive = {
  summary: {
    projectCount: 1,
    contractValue: 100000,
    income: 50000,
    expense: 30000,
    net: 20000,
  },
  topProjects: { profitable: [], unprofitable: [] },
  rows: [],
  filteredRows: [],
}

const minProfitLoss = {
  summary: {
    totalIncome: 50000,
    totalExpense: 30000,
    netProfit: 20000,
    profitMarginPercent: 40,
    projectCount: 1,
  },
  projectRows: [],
  monthlyRows: [],
  projectOptions: [],
}

const minContractors = {
  overview: {
    contractorCount: 1,
    activeContractorCount: 1,
    totalIncome: 0,
    totalExpense: 41000,
    netMovement: -41000,
    entryCount: 3,
    projectCount: 1,
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
}

const minFilters = {
  query: '',
  contractorName: '',
  projectId: '',
  category: '',
  entryType: 'all' as const,
  dateFrom: '',
  dateTo: '',
}

describe('All PDF payloads use COMPANY_NAME', () => {
  it('executive payload uses COMPANY_NAME', () => {
    const p = buildExecutivePdfPayload(minExecutive)
    expect(p.companyName).toBe(COMPANY_NAME)
  })

  it('projects payload uses COMPANY_NAME', () => {
    const p = buildProjectsPdfPayload([], { query: '', statusFilter: '', includeArchived: false })
    expect(p.companyName).toBe(COMPANY_NAME)
  })

  it('journal payload uses COMPANY_NAME', () => {
    const p = buildJournalPdfPayload(
      { allRows: [], contractors: [], paymentMethods: [], projectOptions: [] },
      { ...minFilters, entryType: 'all' },
      0,
    )
    expect(p.companyName).toBe(COMPANY_NAME)
  })

  it('profit-loss payload uses COMPANY_NAME', () => {
    const p = buildProfitLossPdfPayload(minProfitLoss, minFilters)
    expect(p.companyName).toBe(COMPANY_NAME)
  })

  it('contractors payload uses COMPANY_NAME', () => {
    const p = buildContractorsPdfPayload(minContractors, minFilters, 'overview')
    expect(p.companyName).toBe(COMPANY_NAME)
  })
})

// ── RTL — Arabic text present in all reports ──────────────────────────────────

describe('RTL: Arabic titles in all payloads', () => {
  it('executive has Arabic report title', () => {
    const p = buildExecutivePdfPayload(minExecutive)
    expect(p.reportTitle).toMatch(/[\u0600-\u06FF]/)
  })

  it('profit-loss has Arabic report title', () => {
    const p = buildProfitLossPdfPayload(minProfitLoss, minFilters)
    expect(p.reportTitle).toMatch(/[\u0600-\u06FF]/)
  })
})

// ── buildFiltersLabel ─────────────────────────────────────────────────────────

describe('buildFiltersLabel', () => {
  it('returns Arabic fallback when no filters', () => {
    expect(buildFiltersLabel([])).toBe('لا توجد فلاتر مطبقة')
  })

  it('joins filters with Arabic separator', () => {
    const label = buildFiltersLabel([
      { label: 'المقاول', value: 'محمود' },
      { label: 'المشروع', value: 'تاج سلطان' },
    ])
    expect(label).toContain('المقاول: محمود')
    expect(label).toContain('المشروع: تاج سلطان')
  })
})

// ── PdfExportPayload structure integrity ──────────────────────────────────────

describe('Payload structure integrity', () => {
  it('executive payload has required fields', () => {
    const p = buildExecutivePdfPayload(minExecutive)
    expect(p).toHaveProperty('reportTitle')
    expect(p).toHaveProperty('companyName')
    expect(p).toHaveProperty('exportDate')
    expect(p).toHaveProperty('kpis')
    expect(p).toHaveProperty('tables')
    expect(p).toHaveProperty('activeFilters')
    expect(Array.isArray(p.kpis)).toBe(true)
    expect(Array.isArray(p.tables)).toBe(true)
  })

  it('profit-loss payload has two tables', () => {
    const p = buildProfitLossPdfPayload(minProfitLoss, minFilters)
    expect(p.tables).toHaveLength(2)
  })

  it('contractors overview payload has one table', () => {
    const p = buildContractorsPdfPayload(minContractors, minFilters, 'overview')
    expect(p.tables).toHaveLength(1)
  })
})

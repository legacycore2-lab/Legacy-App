import { describe, expect, it } from 'vitest'
import { buildReportsCenterViewModel, filterReportDefinitions } from './reports-center.service'
import { getReportsCenterDefinitions } from './reports-center-navigation.service'

const reports = getReportsCenterDefinitions()

describe('reports center catalogue', () => {
  it('exposes only implemented reports as available', () => {
    const available = reports
      .filter((report) => report.availability === 'available')
      .map((report) => report.key)

    expect(available).toEqual([
      'executive',
      'profit-loss',
      'projects',
      'project-comparison',
      'profitable-projects',
      'loss-making-projects',
      'journal',
      'contractor-statement',
      'contractor-payments',
      'top-contractors',
      'contract-values',
      'income-expense',
      'insights',
    ])
  })

  it('keeps reports without real source data unavailable', () => {
    expect(reports.find((report) => report.key === 'cash-flow')?.availability).toBe('coming-soon')
    expect(reports.find((report) => report.key === 'contractor-dues')?.availability).toBe('coming-soon')
  })

  it('filters by title', () => {
    const result = filterReportDefinitions(reports, 'القيود اليومية', 'all')
    expect(result.map((report) => report.key)).toContain('journal')
  })

  it('filters by description', () => {
    const result = filterReportDefinitions(reports, 'المستندات', 'all')
    expect(result.some((report) => report.category === 'documents')).toBe(true)
  })

  it('filters by keyword', () => {
    const result = filterReportDefinitions(reports, 'سيولة', 'all')
    expect(result.map((report) => report.key)).toContain('cash-flow')
  })

  it('filters by category', () => {
    const result = filterReportDefinitions(reports, '', 'projects')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((report) => report.category === 'projects')).toBe(true)
  })

  it('builds sections and counts from the filtered definitions', () => {
    const filtered = filterReportDefinitions(reports, '', 'executive')
    const viewModel = buildReportsCenterViewModel(filtered)

    expect(viewModel.sections).toHaveLength(1)
    expect(viewModel.sections[0]?.category).toBe('executive')
    expect(viewModel.totalReports).toBe(filtered.length)
    expect(viewModel.availableReports).toBe(3)
  })

  it('counts three available contractor reports and keeps dues disabled', () => {
    const filtered = filterReportDefinitions(reports, '', 'contractors')
    const viewModel = buildReportsCenterViewModel(filtered)

    expect(viewModel.availableReports).toBe(3)
    expect(filtered.find((report) => report.key === 'contractor-dues')?.availability).toBe('coming-soon')
  })

  it('does not mutate report definitions while filtering', () => {
    const before = structuredClone(reports)
    filterReportDefinitions(reports, 'مشروع', 'all')
    expect(reports).toEqual(before)
  })
})

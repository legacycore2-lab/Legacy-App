import { describe, expect, it } from 'vitest'
import { buildReportsCenterViewModel, filterReportDefinitions } from './reports-center.service'
import { getReportsCenterDefinitions } from './reports-center-navigation.service'

const reports = getReportsCenterDefinitions()

describe('reports center catalogue', () => {
  it('exposes only the four approved production reports', () => {
    expect(reports.map((report) => report.key)).toEqual([
      'journal',
      'executive',
      'projects',
      'contractor-statement',
    ])
    expect(reports.every((report) => report.availability === 'available')).toBe(true)
  })

  it('does not expose legacy coming-soon catalogue entries', () => {
    expect(reports.find((report) => report.key === 'cash-flow')).toBeUndefined()
    expect(reports.find((report) => report.key === 'contractor-dues')).toBeUndefined()
    expect(reports.find((report) => report.key === 'profit-loss')).toBeUndefined()
  })

  it('filters by title', () => {
    const result = filterReportDefinitions(reports, 'القيود اليومية', 'all')
    expect(result.map((report) => report.key)).toContain('journal')
  })

  it('filters by description', () => {
    const result = filterReportDefinitions(reports, 'الإيرادات والمصروفات', 'all')
    expect(result.map((report) => report.key)).toContain('executive')
  })

  it('filters by keyword', () => {
    const result = filterReportDefinitions(reports, 'مقاول', 'all')
    expect(result.map((report) => report.key)).toContain('contractor-statement')
  })

  it('filters by category', () => {
    const result = filterReportDefinitions(reports, '', 'projects')
    expect(result).toHaveLength(1)
    expect(result[0]?.key).toBe('projects')
  })

  it('builds sections and counts from the filtered definitions', () => {
    const filtered = filterReportDefinitions(reports, '', 'executive')
    const viewModel = buildReportsCenterViewModel(filtered)

    expect(viewModel.sections).toHaveLength(1)
    expect(viewModel.sections[0]?.category).toBe('executive')
    expect(viewModel.totalReports).toBe(1)
    expect(viewModel.availableReports).toBe(1)
  })

  it('builds one contractor report section', () => {
    const filtered = filterReportDefinitions(reports, '', 'contractors')
    const viewModel = buildReportsCenterViewModel(filtered)

    expect(filtered.map((report) => report.key)).toEqual(['contractor-statement'])
    expect(viewModel.totalReports).toBe(1)
    expect(viewModel.availableReports).toBe(1)
  })

  it('does not mutate report definitions while filtering', () => {
    const before = structuredClone(reports)
    filterReportDefinitions(reports, 'مشروع', 'all')
    expect(reports).toEqual(before)
  })
})

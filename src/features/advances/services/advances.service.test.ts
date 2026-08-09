import { describe, expect, it } from 'vitest'
import { filterAdvances, mapAdvance, summarizeAdvances } from './advances.service'
import type { AdvanceRow } from '../types/advances.types'

const base: AdvanceRow = {
  id: '1',
  advance_number: 7,
  holder_name: 'أحمد سالم',
  holder_title: 'مهندس موقع',
  project_names: ['مول زايد', 'فيلا التجمع'],
  issue_date: '2026-08-01',
  due_date: '2026-08-30',
  purpose: 'مشتريات مواقع',
  amount: 25000,
  spent_amount: 10000,
  returned_amount: 500,
}

describe('advances service', () => {
  it('maps amounts and multiple projects', () => {
    const advance = mapAdvance(base, new Date('2026-08-10'))
    expect(advance.remaining).toBe(14500)
    expect(advance.projectNames).toEqual(['مول زايد', 'فيلا التجمع'])
    expect(advance.status).toBe('open')
  })
  it('marks overdue and settled advances', () => {
    expect(mapAdvance({ ...base, due_date: '2026-08-01' }, new Date('2026-08-10')).status).toBe('overdue')
    expect(mapAdvance({ ...base, spent_amount: 24500 }, new Date('2026-08-10')).status).toBe('settled')
  })
  it('searches and filters by any linked project', () => {
    const advances = [mapAdvance(base, new Date('2026-08-10'))]
    expect(filterAdvances(advances, { search: 'التجمع', status: 'all', project: 'all' })).toHaveLength(1)
    expect(filterAdvances(advances, { search: '', status: 'open', project: 'مول زايد' })).toHaveLength(1)
    expect(filterAdvances(advances, { search: '', status: 'open', project: 'مشروع آخر' })).toHaveLength(0)
  })
  it('builds the financial summary', () => {
    const advances = [
      mapAdvance(base, new Date('2026-08-10')),
      mapAdvance(
        { ...base, id: '2', amount: 1000, spent_amount: 1000, returned_amount: 0 },
        new Date('2026-08-10'),
      ),
    ]
    expect(summarizeAdvances(advances)).toEqual({
      openCount: 1,
      totalSpent: 11000,
      totalRemaining: 14500,
      overdueCount: 0,
    })
  })
})

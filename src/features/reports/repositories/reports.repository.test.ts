import { describe, expect, it } from 'vitest'
import { applyReportReversalSigns } from './reports.repository'

describe('applyReportReversalSigns', () => {
  it('makes reversal amounts negative while keeping original entries positive', () => {
    const rows = [
      { id: 'original', amount: 1500 },
      { id: 'reversal', amount: 1500 },
    ]

    expect(applyReportReversalSigns(rows, new Set(['reversal']))).toEqual([
      { id: 'original', amount: 1500 },
      { id: 'reversal', amount: -1500 },
    ])
  })

  it('does not mutate the input rows', () => {
    const rows = [{ id: 'reversal', amount: '1500' }]
    applyReportReversalSigns(rows, new Set(['reversal']))
    expect(rows).toEqual([{ id: 'reversal', amount: '1500' }])
  })

  it('leaves unrelated rows unchanged', () => {
    const rows = [{ id: 'normal', amount: 500 }]
    expect(applyReportReversalSigns(rows, new Set(['other']))).toEqual(rows)
  })
})

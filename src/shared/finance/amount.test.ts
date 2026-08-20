import { describe, expect, it } from 'vitest'

import { aggregateFinancialTotals, financialAmount, reverseFinancialAmount } from './amount'

describe('shared finance amount helpers', () => {
  it('keeps signed amounts unchanged', () => {
    expect(financialAmount(1500)).toBe(1500)
    expect(financialAmount(-1500)).toBe(-1500)
  })

  it('reverses an amount by flipping its sign', () => {
    expect(reverseFinancialAmount(1500)).toBe(-1500)
    expect(reverseFinancialAmount(-1500)).toBe(1500)
  })

  it('nets an original expense and its reversal to zero', () => {
    const totals = aggregateFinancialTotals([
      { type: 'expense', amount: 1500 },
      { type: 'expense', amount: -1500 },
    ])

    expect(totals).toEqual({
      income: 0,
      expense: 0,
      net: 0,
    })
  })

  it('nets an original income and its reversal to zero', () => {
    const totals = aggregateFinancialTotals([
      { type: 'income', amount: 1500 },
      { type: 'income', amount: -1500 },
    ])

    expect(totals).toEqual({
      income: 0,
      expense: 0,
      net: 0,
    })
  })

  it('rejects non-finite financial amounts', () => {
    expect(() => financialAmount(Number.NaN)).toThrow(TypeError)
    expect(() => financialAmount(Number.POSITIVE_INFINITY)).toThrow(TypeError)
  })
})

import { describe, expect, it } from 'vitest'
import type { ContractorEntryRecord } from '../types/contractor.types'
import { buildContractors } from './contractors.service'

function makeRecord(overrides: Partial<ContractorEntryRecord>): ContractorEntryRecord {
  return {
    id: 'entry-1',
    contractor_name: 'مصباح',
    project_id: 'project-1',
    entry_date: '2026-08-20',
    entry_type: 'expense',
    amount: 1500,
    is_reversal: false,
    description: 'شراء',
    entry_number: 58,
    projects: { id: 'project-1', name: 'هايد بارك' },
    ...overrides,
  }
}

describe('contractor reversal accounting', () => {
  it('nets an expense and its reversal to zero', () => {
    const [contractor] = buildContractors([
      makeRecord({ id: 'original', entry_number: 58 }),
      makeRecord({
        id: 'reversal',
        entry_number: 60,
        description: 'عكس: شراء',
        is_reversal: true,
      }),
    ])

    expect(contractor.totalExpense).toBe(0)
    expect(contractor.netMovement).toBe(0)
    expect(contractor.entryCount).toBe(2)
    expect(contractor.entries.find((entry) => entry.id === 'reversal')?.isReversal).toBe(true)
  })
})

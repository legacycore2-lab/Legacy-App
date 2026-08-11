import { describe, expect, it } from 'vitest'
import type { JournalDetailsRecord } from '../repositories/journal.repository'
import { mapJournalDetails } from './journal.mapper'

function record(status: string): JournalDetailsRecord {
  return {
    id: 'journal-1',
    journal_number: 1,
    journal_date: '2026-08-11',
    description: 'قيد',
    status,
    created_at: '2026-08-11T10:00:00Z',
    posted_at: '2026-08-11T10:00:01Z',
    project: { name: 'مشروع' },
    lines: [],
  }
}

describe('mapJournalDetails status validation', () => {
  it.each(['draft', 'posted', 'reversed'])('accepts supported status %s', (status) => {
    expect(mapJournalDetails(record(status)).status).toBe(status)
  })

  it('rejects an unknown database status instead of coercing it to posted', () => {
    expect(() => mapJournalDetails(record('cancelled'))).toThrow('حالة القيد غير صالحة')
  })
})

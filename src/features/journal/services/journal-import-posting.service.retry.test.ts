import { beforeEach, describe, expect, it, vi } from 'vitest'
import { importJournalEntriesAtomic } from '../repositories/journal-import.repository'
import type { JournalImportPreview } from '../types/journal-import.types'
import { commitJournalImport } from './journal-import-posting.service'

vi.mock('../repositories/journal-import.repository', () => ({
  importJournalEntriesAtomic: vi.fn(),
}))

const preview: JournalImportPreview = {
  fileName: 'journal.xlsx',
  rows: [
    {
      excelRow: 2,
      project: 'مشروع',
      projectId: 'project-1',
      date: '2026-08-11',
      type: 'expense',
      category: 'خامات',
      categoryAccountId: 'expense-account',
      description: 'شراء خامات',
      contractor: 'مقاول',
      paymentMethod: 'البنك',
      paymentAccountId: 'bank-account',
      amount: 1000,
      notes: '',
      status: 'valid',
      errors: [],
    },
  ],
  totalRows: 1,
  validRows: 1,
  invalidRows: 0,
  canImport: true,
}

describe('commitJournalImport retry idempotency', () => {
  beforeEach(() => {
    vi.mocked(importJournalEntriesAtomic).mockReset()
    delete preview.rows[0].requestId
  })

  it('reuses the same request id when the same preview is retried', async () => {
    const capturedRequestIds: string[] = []
    vi.mocked(importJournalEntriesAtomic)
      .mockImplementationOnce(async (rows) => {
        capturedRequestIds.push(rows[0].requestId)
        throw new Error('network timeout')
      })
      .mockImplementationOnce(async (rows) => {
        capturedRequestIds.push(rows[0].requestId)
        return ['entry-1']
      })

    await expect(commitJournalImport(preview)).rejects.toThrow('network timeout')
    await expect(commitJournalImport(preview)).resolves.toBe(1)

    expect(capturedRequestIds).toHaveLength(2)
    expect(capturedRequestIds[0]).toBeTruthy()
    expect(capturedRequestIds[1]).toBe(capturedRequestIds[0])
  })
})

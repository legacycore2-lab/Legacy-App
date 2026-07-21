import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postSingleLineEntry } from '../repositories/journal.repository'
import type { SingleLineJournalInput } from '../types/journal-entry.types'
import { submitSingleLineEntry } from './journal-entry.service'

vi.mock('../repositories/journal.repository', () => ({
  postSingleLineEntry: vi.fn(),
}))

const validInput: SingleLineJournalInput = {
  entryDate: '2026-07-22',
  projectName: 'مشروع اختبار',
  type: 'expense',
  category: '5100',
  description: 'شراء خامات',
  contractor: 'مورد',
  paymentAccount: '1100',
  amount: '1250.50',
}

describe('single-line journal submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes a valid user-facing line to the repository', async () => {
    vi.mocked(postSingleLineEntry).mockResolvedValue('entry-id')

    await expect(submitSingleLineEntry(validInput)).resolves.toBe('entry-id')
    expect(postSingleLineEntry).toHaveBeenCalledWith(validInput)
  })

  it('does not call the repository when validation fails', async () => {
    await expect(submitSingleLineEntry({ ...validInput, amount: '0' })).rejects.toThrow(
      'أدخل مبلغًا صحيحًا أكبر من صفر.',
    )
    expect(postSingleLineEntry).not.toHaveBeenCalled()
  })
})
